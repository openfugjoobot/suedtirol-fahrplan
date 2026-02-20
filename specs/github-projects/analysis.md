# GitHub Projects v2 API Analysis

**Date:** 2026-02-20  
**Agent:** Research Subagent  
**Scope:** Analysis for OpenFugjooBot Master Board implementation

---

## Executive Summary

GitHub Projects v2 provides a robust GraphQL-first API for board automation. The API supports organization-level projects that can aggregate issues from multiple repositories. Auto-add workflows require native GitHub workflows or custom automation. Custom fields (including single-select "Phase" fields) are fully programmable via GraphQL mutations.

**Recommendation:** Use GraphQL API via `gh` CLI or direct HTTP calls. REST API has limited Projects v2 support.

---

## 1. GitHub Projects v2 GraphQL API

### 1.1 Key Queries

#### Find Organization Project
```graphql
query {
  organization(login: "openfugjoobot") {
    projectV2(number: 1) {
      id
      title
      number
      url
      fields(first: 20) {
        nodes {
          ... on ProjectV2FieldCommon {
            id
            name
          }
          ... on ProjectV2SingleSelectField {
            id
            name
            options {
              id
              name
            }
          }
        }
      }
    }
  }
}
```

#### List Project Items
```graphql
query {
  node(id: "PROJECT_ID") {
    ... on ProjectV2 {
      items(first: 100) {
        nodes {
          id
          content {
            ... on Issue {
              id
              number
              title
              url
              repository {
                name
              }
            }
            ... on PullRequest {
              id
              number
              title
            }
          }
          fieldValues(first: 8) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                field {
                  name
                }
                optionId
                name
              }
              ... on ProjectV2ItemFieldTextValue {
                field {
                  name
                }
                text
              }
            }
          }
        }
      }
    }
  }
}
```

### 1.2 Key Mutations

#### Add Item to Project
```graphql
mutation {
  addProjectV2ItemById(input: {
    projectId: "PROJECT_ID"
    contentId: "ISSUE_NODE_ID"
  }) {
    item {
      id
    }
  }
}
```

#### Update Custom Field (Single Select - e.g., Phase)
```graphql
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "PROJECT_ID"
    itemId: "ITEM_ID"
    fieldId: "FIELD_ID"
    value: {
      singleSelectOptionId: "OPTION_ID"
    }
  }) {
    projectV2Item {
      id
    }
  }
}
```

#### Update Custom Field (Text/Number)
```graphql
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "PROJECT_ID"
    itemId: "ITEM_ID"
    fieldId: "FIELD_ID"
    value: {
      text: "Phase 4"
      # or number: 4
    }
  }) {
    projectV2Item {
      id
    }
  }
}
```

#### Archive Item
```graphql
mutation {
  archiveProjectV2Item(input: {
    projectId: "PROJECT_ID"
    itemId: "ITEM_ID"
  }) {
    clientMutationId
  }
}
```

#### Delete Item
```graphql
mutation {
  deleteProjectV2Item(input: {
    projectId: "PROJECT_ID"
    itemId: "ITEM_ID"
  }) {
    deletedItemId
  }
}
```

#### Move Item Position (reorder)
```graphql
mutation {
  updateProjectV2ItemPosition(input: {
    projectId: "PROJECT_ID"
    itemId: "ITEM_ID"
    afterId: "AFTER_ITEM_ID"  # or use `beforeId`
  }) {
    items {
      nodes {
        id
      }
    }
  }
}
```

---

## 2. Auto-Add Workflows

### 2.1 Native GitHub Auto-Add

GitHub Projects v2 has **built-in auto-add workflows** accessible via the UI/API:

- **Limitation:** Auto-add workflows in Projects v2 can only be configured via the GitHub UI or through GraphQL mutations
- **Multi-repo support:** Yes - Organization projects can auto-add from linked repositories
- **Configuration:** Available at Project Settings → Workflows → Auto-add

### 2.2 GraphQL Workflow Management

#### Create Auto-Add Workflow (via GraphQL)
```graphql
mutation {
  createProjectV2Workflow(input: {
    projectId: "PROJECT_ID"
    name: "Auto-add new issues"
    enabled: true
    autoAddParams: {
      filters: [
        {key: "type", values: ["issue"]}
      ]
    }
  }) {
    workflow {
      id
      name
    }
  }
}
```

**Important:** The `createProjectV2Workflow` mutation exists but has limited documentation. Manual verification required.

### 2.3 Recommended Approach for OpenFugjooBot

Since native auto-add has limitations:

1. **Primary:** Create a GitHub Actions workflow in each repository that calls the GraphQL API
2. **Secondary:** Use a scheduled polling mechanism or webhook listener for external automation

#### GitHub Actions Example (auto-add on issue open)
```yaml
name: Auto-add to Master Board
on:
  issues:
    types: [opened, reopened]
jobs:
  add-to-project:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/add-to-project@v1
        with:
          project-url: https://github.com/orgs/openfugjoobot/projects/1
          github-token: ${{ secrets.ADD_TO_PROJECT_PAT }}
```

---

## 3. Organization vs Repository Projects

| Feature | Organization Projects | Repository Projects |
|---------|----------------------|---------------------|
| Scope | Cross-repository | Single repository |
| Auto-add from multiple repos | ✅ Yes (via linking) | ❌ No |
| CLI access | `gh project list --owner org` | `gh project list --owner @me` |
| Visibility | Org-level permissions | Repo-level permissions |
| API Endpoint | `/orgs/{org}/projectsV2` | `/repos/{owner}/{repo}/projects` |

### 3.1 Linking Repositories to Organization Project

```bash
# Link a repository to an organization project
gh project link 1 --owner openfugjoobot --repo my-repo
```

```graphql
mutation {
  linkProjectV2ToRepository(input: {
    projectId: "PROJECT_ID"
    repositoryId: "REPO_ID"
  }) {
    repository {
      name
    }
  }
}
```

**Recommendation:** Use an Organization Project for the OpenFugjooBot Master Board to enable cross-repo issue aggregation.

---

## 4. Custom Fields API

### 4.1 Field Types Available

| Type | Use Case | GraphQL Type |
|------|----------|--------------|
| Text | Notes, references | `ProjectV2Field` |
| Number | Phase (0-8) | `ProjectV2Field` |
| Date | Deadlines | `ProjectV2Field` |
| Single Select | Status, Priority | `ProjectV2SingleSelectField` |
| Iteration | Sprints | `ProjectV2IterationField` |

### 4.2 Creating a "Phase" Field

#### Option A: Number Field (recommended for 0-8 scale)
```graphql
mutation {
  createProjectV2Field(input: {
    projectId: "PROJECT_ID"
    name: "Phase"
    dataType: NUMBER
  }) {
    projectV2Field {
      id
      name
    }
  }
}
```

#### Option B: Single Select Field (for named phases)
```graphql
mutation {
  createProjectV2Field(input: {
    projectId: "PROJECT_ID"
    name: "Phase"
    dataType: SINGLE_SELECT
    singleSelectOptions: [
      {name: "0 - Backlog", color: "GRAY"}
      {name: "1 - Discovery", color: "BLUE"}
      {name: "2 - Analysis", color: "PURPLE"}
      {name: "3 - Design", color: "GREEN"}
      {name: "4 - Implementation", color: "YELLOW"}
      {name: "5 - Testing", color: "ORANGE"}
      {name: "6 - Review", color: "RED"}
      {name: "7 - Done", color: "GREEN"}
      {name: "8 - Archived", color: "GRAY"}
    ]
  }) {
    projectV2Field {
      id
      name
    }
  }
}
```

### 4.3 Setting Field Values

**Via CLI:**
```bash
gh project item-edit \
  --id "ITEM_ID" \
  --project-id "PROJECT_ID" \
  --field-id "PHASE_FIELD_ID" \
  --number 4
```

**Via GraphQL:**
```graphql
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "PROJECT_ID"
    itemId: "ITEM_ID"
    fieldId: "PHASE_FIELD_ID"
    value: { number: 4 }
  }) {
    projectV2Item {
      id
    }
  }
}
```

### 4.4 Listing Field Options

```graphql
query {
  node(id: "PROJECT_ID") {
    ... on ProjectV2 {
      fields(first: 20) {
        nodes {
          ... on ProjectV2SingleSelectField {
            id
            name
            options {
              id
              name
              color
            }
          }
        }
      }
    }
  }
}
```

---

## 5. Webhooks

### 5.1 Available Project Events

| Event | Actions | Description |
|-------|---------|-------------|
| `projects_v2` | created, edited, deleted | Project lifecycle |
| `projects_v2_item` | created, edited, deleted, archived, restored | Item changes |

### 5.2 Webhook Payload Structure (projects_v2_item)

```json
{
  "action": "created",
  "projects_v2_item": {
    "id": 123456,
    "node_id": "PVTI_lADOANN5s84ACbL0zgNEd-0",
    "project_node_id": "PVT_kwDOANN5s84ACbL0",
    "content_node_id": "I_kwDOBLY3A86K3e0Z",
    "content_type": "Issue",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "archived_at": null,
    "creator": {
      "login": "octocat"
    }
  },
  "sender": {...}
}
```

### 5.3 Limitations

**No direct webhook for field value changes:**
- The `projects_v2_item` webhook fires when an item is added/removed/archived
- Field value changes (like Phase or Status) do **NOT** trigger webhooks
- **Workaround:** Poll for changes or use `issues` webhook + label changes

### 5.4 Recommended Webhook Strategy

For real-time status sync:

1. **Repository webhooks:** Subscribe to `issues` events
2. **Organization webhooks:** Subscribe to `projects_v2_item` events
3. **Combined approach:**
   - Use `issues.labeled` to trigger status updates
   - Use `projects_v2_item.created` to detect new items
   - Poll every 5 minutes for field value changes

### 5.5 Creating Webhooks

**Organization webhook:**
```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/orgs/openfugjoobot/hooks \
  -d '{
    "name": "web",
    "active": true,
    "events": ["projects_v2_item", "issues"],
    "config": {
      "url": "https://api.openfugjoo.io/webhooks/github",
      "content_type": "json",
      "secret": "webhook_secret"
    }
  }'
```

---

## 6. Rate Limits

### 6.1 GraphQL API Rate Limits

| Authentication | Points/Hour | Notes |
|----------------|-------------|-------|
| Personal Access Token | 5,000 | Per user |
| GitHub Actions (GITHUB_TOKEN) | 1,000 | Per repository |
| GitHub App (Installation) | 5,000+ | +50 per repo > 20, +50 per user > 20 |
| GitHub Enterprise Cloud | 10,000 | Higher limits |

### 6.2 Secondary Rate Limits

- **Concurrent requests:** Max 100 (shared REST + GraphQL)
- **GraphQL mutations:** 2,000 points/minute
- **Content creation:** 80/minute, 500/hour
- **CPU time:** Max 90 sec CPU per 60 sec real time (60 sec for GraphQL)

### 6.3 Rate Limit Headers

```
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4999
X-RateLimit-Used: 1
X-RateLimit-Reset: 1691593228
```

### 6.4 Query Cost Calculation

```graphql
query {
  viewer { login }
  rateLimit {
    limit
    remaining
    used
    resetAt
    cost
  }
}
```

### 6.5 Cost Optimization Tips

1. **Batch operations:** Use fewer, larger queries
2. **Pagination:** Use `first: 100` instead of multiple requests
3. **Field selection:** Only request fields you need
4. **Caching:** Cache field IDs, option IDs locally

---

## 7. Recommended Architecture

### 7.1 API Approach

**Primary:** GraphQL via `gh` CLI
- Easier authentication
- Built-in token management
- JSON output support

**Secondary:** Direct GraphQL HTTP for complex queries

### 7.2 Data Flow

```
┌─────────────┐     ┌─────────────────┐     ┌───────────────┐
│  Issue      │────▶│  GitHub Webhook │────▶│  OpenClaw     │
│  Activity   │     │  (issues event) │     │  Agent        │
└─────────────┘     └─────────────────┘     └───────────────┘
                                                    │
                         ┌─────────────────────────┘
                         ▼
              ┌────────────────────┐
              │  GraphQL API       │
              │  Update Board      │
              └────────────────────┘
```

### 7.3 Implementation Phases

**Phase 1: Basic Integration**
- Create organization project
- Link repositories
- Create "Phase" custom field

**Phase 2: Auto-Add**
- Implement repository webhooks
- Auto-add issues on creation

**Phase 3: Status Sync**
- Label → Column mapping
- 5-minute polling for field values

**Phase 4: CLI Integration**
- `gh projects sync` command
- Agent completion integration

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Rate limiting | Medium | High | Implement backoff, batch operations |
| Webhook delivery failures | Low | Medium | Add polling fallback |
| GraphQL schema changes | Low | Medium | Pin to API version, monitor changelog |
| Token expiration | Low | High | Automated token refresh |
| Field ID changes | Low | Low | Cache with TTL, fetch dynamically |
| No webhook for field changes | Certain | Medium | Accept polling requirement |

### 8.1 Key Constraints

1. **No real-time field updates:** Must poll every 5 minutes
2. **Complex initial setup:** Requires fetching multiple IDs (project, field, options)
3. **Token scope requirement:** `project` scope needed for all mutations
4. **Multi-repo auto-add:** Requires either native workflows or custom GitHub Actions

---

## 9. Sample Queries/Mutations Reference

### Get All Required IDs (Setup Script)
```graphql
query {
  organization(login: "openfugjoobot") {
    projectV2(number: 1) {
      id
      title
      fields(first: 20) {
        nodes {
          ... on ProjectV2FieldCommon {
            id
            name
          }
          ... on ProjectV2SingleSelectField {
            id
            name
            options {
              id
              name
            }
          }
        }
      }
    }
  }
}
```

### Full Issue-to-Board Sync
```graphql
query($issueNumber: Int!, $repoOwner: String!, $repoName: String!) {
  repository(owner: $repoOwner, name: $repoName) {
    issue(number: $issueNumber) {
      id
      title
      state
      labels(first: 10) {
        nodes {
          name
        }
      }
      projectItems(first: 10) {
        nodes {
          id
          project {
            id
            title
          }
          fieldValues(first: 10) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                field {
                  name
                }
                name
              }
            }
          }
        }
      }
    }
  }
}
```

---

## 10. References

- [GitHub Projects GraphQL API Guide](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects)
- [GraphQL Rate Limits](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api)
- [Webhook Events](https://docs.github.com/en/webhooks/webhook-events-and-payloads)
- [gh project CLI](https://cli.github.com/manual/gh_project)
- [GitHub Actions - add-to-project](https://github.com/marketplace/actions/add-to-github-projects)

---

**Status:** Analysis Complete  
**Next:** Phase 2 - Implementation Planning
