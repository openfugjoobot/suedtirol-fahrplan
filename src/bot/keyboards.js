/**
 * Südtirol Fahrplan - Inline Keyboards
 * Keyboard generators for Telegram bot
 */

/**
 * Create stop selection keyboard
 * @param {Array} stops - Array of stop objects
 * @param {string} action - Callback action prefix
 * @returns {Object} Inline keyboard markup
 */
function createStopKeyboard(stops, action = 'select_stop') {
  const buttons = stops.slice(0, 10).map(stop => ([{
    text: `📍 ${stop.name}${stop.place ? ` (${stop.place})` : ''}`,
    callback_data: `${action}:${stop.id}`
  }]));

  return { inline_keyboard: buttons };
}

/**
 * Create departures action keyboard
 * @param {string} stopId - Stop ID for refresh
 * @returns {Object} Inline keyboard markup
 */
function createDeparturesKeyboard(stopId) {
  return {
    inline_keyboard: [
      [
        { text: '🔄 Aktualisieren', callback_data: `refresh_departures:${stopId}` }
      ],
      [
        { text: '🗺️ Route planen', callback_data: 'start_route_search' },
        { text: '❓ Hilfe', callback_data: 'show_help' }
      ]
    ]
  };
}

/**
 * Create route selection keyboard
 * @param {Array} trips - Array of trip objects
 * @returns {Object} Inline keyboard markup
 */
function createRouteKeyboard(trips) {
  const buttons = trips.slice(0, 5).map((trip, index) => ([{
    text: `${index + 1}. Route Details`,
    callback_data: `show_route_details:${index}`
  }]));

  buttons.push([
    { text: '🔄 Neue Suche', callback_data: 'start_route_search' }
  ]);

  return { inline_keyboard: buttons };
}

/**
 * Create help keyboard with quick actions
 * @returns {Object} Inline keyboard markup
 */
function createHelpKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🔍 Haltestelle suchen', callback_data: 'action_search' }
      ],
      [
        { text: '🚌 Abfahrten', callback_data: 'action_departures' }
      ],
      [
        { text: '🗺️ Route planen', callback_data: 'start_route_search' }
      ]
    ]
  };
}

/**
 * Create error/retry keyboard
 * @param {string} action - Action to retry
 * @param {string} param - Parameter for retry
 * @returns {Object} Inline keyboard markup
 */
function createErrorKeyboard(action, param) {
  return {
    inline_keyboard: [
      [
        { text: '🔄 Erneut versuchen', callback_data: `${action}:${param}` }
      ],
      [
        { text: '📖 Hilfe', callback_data: 'show_help' }
      ]
    ]
  };
}

/**
 * Create language selection keyboard
 * @returns {Object} Inline keyboard markup
 */
function createLanguageKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🇩🇪 Deutsch', callback_data: 'lang:de' },
        { text: '🇮🇹 Italiano', callback_data: 'lang:it' }
      ]
    ]
  };
}

// ==================== EXPORTS ====================

module.exports = {
  createStopKeyboard,
  createDeparturesKeyboard,
  createRouteKeyboard,
  createHelpKeyboard,
  createErrorKeyboard,
  createLanguageKeyboard
};
