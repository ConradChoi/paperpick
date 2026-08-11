// PostgREST's `.or()` filter string is a mini query language where `,` `(` `)`
// are syntax, not literal characters. Interpolating raw user input into it
// let a search term containing those characters silently break the filter
// or splice in unintended conditions. None of them are meaningful in a
// name/contact search, so stripping is simpler and safer than trying to
// exactly replicate PostgREST's escaping rules. Also strips `%`/`_` (ILIKE
// wildcards) so a search term can't widen the match beyond what the caller
// intended.
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()%_]/g, "");
}
