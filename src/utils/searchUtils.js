/**
 * Smart customer-name search.
 *
 * Plain substring matching (name.includes(query)) has a collision problem:
 * searching "nebil" also matches "nebila", "nebiluu", etc. because they all
 * *contain* "nebil". That silently pulls a different customer's sales/loans
 * into totals the user didn't ask for.
 *
 * Fix, in two steps:
 *   1. Match at word boundaries only ("nebil" matches the start of the word
 *      "Nebil"/"Nebila", not the middle of an unrelated word).
 *   2. If the typed query is an EXACT whole word for at least one customer
 *      (e.g. the user finished typing "nebil" and a customer is literally
 *      named "Nebil"), narrow the results to only exact whole-word matches
 *      — so "Nebila" drops out once "Nebil" is fully/exactly matched.
 *      While still mid-type (no exact whole-word match yet), the broader
 *      prefix match is kept so incremental search still works.
 */

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Query matches at the start of a word inside text (case-insensitive)
function wordStartMatch(text, q) {
  if (!text || !q) return false;
  return new RegExp(`\\b${escapeRegExp(q)}`, 'i').test(text);
}

// Query matches a whole word inside text (case-insensitive)
function wholeWordMatch(text, q) {
  if (!text || !q) return false;
  return new RegExp(`\\b${escapeRegExp(q)}\\b`, 'i').test(text);
}

/**
 * Filters a list of items by a search query, matching against a customer
 * name field and an optional secondary field (e.g. product name).
 *
 * @param {Array} items
 * @param {string} query
 * @param {(item: any) => string} getCustomerName
 * @param {(item: any) => string} [getSecondary] - e.g. product name; still plain substring matched
 */
export function smartCustomerSearch(items, query, getCustomerName, getSecondary) {
  const q = (query || '').trim();
  if (!q) return items;

  const qLower = q.toLowerCase();
  const prefixMatches = items.filter(item =>
    wordStartMatch(getCustomerName(item), q) ||
    (getSecondary && getSecondary(item)?.toLowerCase().includes(qLower))
  );

  const hasExactNameMatch = prefixMatches.some(item => wholeWordMatch(getCustomerName(item), q));
  if (!hasExactNameMatch) return prefixMatches;

  // Narrow to exact whole-word customer matches once one exists, but still
  // keep items that only matched via the secondary field (e.g. product name)
  return prefixMatches.filter(item =>
    wholeWordMatch(getCustomerName(item), q) ||
    (getSecondary && getSecondary(item)?.toLowerCase().includes(qLower))
  );
}
