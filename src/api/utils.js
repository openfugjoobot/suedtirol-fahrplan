/**
 * Strip HTML tags and decode entities
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Parse info object (shared between departures and trip)
 */
function parseInfoObject(info) {
  if (!info) return null;
  
  const infoItem = Array.isArray(info) ? info[0] : info;
  
  return {
    url: infoItem.infoLinkURL || infoItem.url || '',
    linkText: infoItem.infoLinkText || infoItem.linkText || '',
    subject: infoItem.infoText?.subject || infoItem.subject || infoItem.name || '',
    subtitle: infoItem.infoText?.subtitle || infoItem.subtitle || '',
    content: stripHtml(infoItem.infoText?.content || infoItem.content || ''),
    additionalText: stripHtml(infoItem.infoText?.additionalText || infoItem.additionalText || '')
  };
}

module.exports = { stripHtml, parseInfoObject };
