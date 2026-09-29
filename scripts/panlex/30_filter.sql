PRAGMA memory_limit='8GB';
PRAGMA temp_directory='data/duckdb_spill';
PRAGMA threads=4;


-- =========================================================================
-- Import Tables
-- =========================================================================

CREATE VIEW languages AS
    SELECT * FROM read_csv('data/10_languages.tsv', delim='\t', header=true);

CREATE VIEW entries AS
    SELECT * FROM read_csv('data/29_entries_dedup.tsv', delim='\t', header=true);


-- =========================================================================
-- Filter
-- =========================================================================


CREATE TEMP TABLE languages_entry_count AS
    SELECT
        e.lang AS id,
        regexp_replace(l.code, '-000$', '') AS code,
        COUNT(*) AS entry_count
    FROM entries e
    JOIN languages l
        ON e.lang = l.id
    WHERE l.code LIKE '%-000'
    GROUP BY e.lang, l.code
    ORDER BY entry_count DESC;
COPY (
    SELECT *
    FROM languages_entry_count
) TO 'data/30_languages_entry_count.tsv' (HEADER, DELIMITER '\t');


CREATE TEMP TABLE concepts_entry_count_all_top_9_languages AS
    SELECT
        e.concept AS id,
        COUNT(*) AS entry_count
    FROM entries e
    JOIN (
        SELECT id
        FROM languages_entry_count
        ORDER BY entry_count DESC
        LIMIT 9
    ) l
        ON e.lang = l.id
    GROUP BY e.concept
    HAVING COUNT(DISTINCT e.lang) = 9
    ORDER BY entry_count DESC;
-- COPY (
--     SELECT *
--     FROM concepts_entry_count_all_top_9_languages
-- ) TO 'data/concepts_entry_count_all_top_9_languages.tsv' (HEADER, DELIMITER '\t');

/*
CREATE TEMP TABLE concepts_entry_count_7_in_top_10_languages AS
    SELECT
        e.concept AS id,
        COUNT(*) AS entry_count
    FROM entries e
    JOIN (
        SELECT id
        FROM languages_entry_count
        ORDER BY entry_count DESC
        LIMIT 10
    ) l
        ON e.lang = l.id
    GROUP BY e.concept
    HAVING COUNT(DISTINCT e.lang) >= 7
    ORDER BY entry_count DESC;
COPY (
    SELECT *
    FROM concepts_entry_count_7_in_top_10_languages
) TO 'data/31_concepts_entry_count_7_in_top_10_languages.tsv' (HEADER, DELIMITER '\t');
*/

CREATE VIEW concepts_entry_count_selected AS
    SELECT * FROM concepts_entry_count_all_top_9_languages;
    -- SELECT * FROM concepts_entry_count_7_in_top_10_languages;


CREATE TEMP TABLE entries_concepts_selected AS
    SELECT e.*
    FROM entries e
    JOIN concepts_entry_count_selected c
        ON e.concept = c.id;
-- COPY (
--     SELECT *
--     FROM entries_concepts_selected
-- ) TO 'data/entries_concepts_selected.tsv' (HEADER, DELIMITER '\t');

CREATE TEMP TABLE languages_entry_count_entries_concepts_selected AS
    SELECT
        l.*,
        COUNT(*) AS entry_count
    FROM languages l
    JOIN entries_concepts_selected e
        ON l.id = e.lang
    GROUP BY ALL
    ORDER BY entry_count DESC;
COPY (
    SELECT *
    FROM languages_entry_count_entries_concepts_selected
) TO 'data/32_languages_entry_count_entries_concepts_selected.tsv' (HEADER, DELIMITER '\t');


-- =========================================================================
-- Output Final Tables
-- =========================================================================

COPY (
    SELECT id
    FROM concepts_entry_count_selected
) TO 'data/40_concepts_final.tsv' (HEADER, DELIMITER '\t');

CREATE TEMP TABLE languages_final AS
    SELECT id, regexp_replace(code, '-000$', '') AS code
    FROM languages_entry_count_entries_concepts_selected
    WHERE entry_count > 5000 and code LIKE '%-000';
COPY (
    SELECT *
    FROM languages_final
) TO 'data/40_languages_final.tsv' (HEADER, DELIMITER '\t');

COPY (
    SELECT e.*
    FROM entries_concepts_selected e
    JOIN languages_final l
        ON e.lang = l.id
) TO 'data/40_entries_final.tsv' (HEADER, DELIMITER '\t');
