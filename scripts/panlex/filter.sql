PRAGMA memory_limit='8GB';
PRAGMA temp_directory='data/duckdb_spill';
PRAGMA threads=4;


CREATE VIEW concepts AS
    SELECT * FROM read_csv('data/concepts.tsv', delim='\t', header=true);

CREATE VIEW languages AS
    SELECT * FROM read_csv('data/languages.tsv', delim='\t', header=true);

CREATE VIEW entries AS
    SELECT * FROM read_csv('data/entries.tsv', delim='\t', header=true);


CREATE TEMP TABLE languages_entry_count AS
    SELECT
        e.language_id AS id,
        regexp_replace(l.iso_code, '-000$', '') AS iso_code,
        COUNT(*) AS entry_count
    FROM entries e
    JOIN languages l
        ON e.language_id = l.id
    WHERE l.iso_code LIKE '%-000'
    GROUP BY e.language_id, l.iso_code
    ORDER BY entry_count DESC;
-- COPY (
--     SELECT *
--     FROM languages_entry_count
-- ) TO 'data/languages_entry_count.tsv' (HEADER, DELIMITER '\t');


CREATE TEMP TABLE concepts_entry_count_all_top_10_languages AS
    SELECT
        e.concept_id AS id,
        COUNT(*) AS entry_count
    FROM entries e
    JOIN (
        SELECT id
        FROM languages_entry_count
        ORDER BY entry_count DESC
        LIMIT 10
    ) l
        ON e.language_id = l.id
    GROUP BY e.concept_id
    HAVING COUNT(DISTINCT e.language_id) = 10
    ORDER BY entry_count DESC;
-- COPY (
--     SELECT *
--     FROM concepts_entry_count_all_top_10_languages
-- ) TO 'data/concepts_entry_count_all_top_10_languages.tsv' (HEADER, DELIMITER '\t');

CREATE TEMP TABLE entries_concepts_all_top_10_languages AS
    SELECT e.*
    FROM entries e
    JOIN concepts_entry_count_all_top_10_languages c
        ON e.concept_id = c.id;
-- COPY (
--     SELECT *
--     FROM entries_concepts_all_top_10_languages
-- ) TO 'data/entries_concepts_all_top_10_languages.tsv' (HEADER, DELIMITER '\t');

CREATE TEMP TABLE languages_entry_count_entries_concepts_all_top_10_languages AS
    SELECT
        l.*,
        COUNT(*) AS entry_count
    FROM languages l
    JOIN entries_concepts_all_top_10_languages e
        ON l.id = e.language_id
    GROUP BY ALL
    ORDER BY entry_count DESC;
-- COPY (
--     SELECT *
--     FROM languages_entry_count_entries_concepts_all_top_10_languages
-- ) TO 'data/languages_entry_count_entries_concepts_all_top_10_languages.tsv' (HEADER, DELIMITER '\t');


COPY (
    SELECT id
    FROM concepts_entry_count_all_top_10_languages
) TO 'data/concepts_final.tsv' (HEADER, DELIMITER '\t');

CREATE TEMP TABLE languages_final AS
    SELECT id, regexp_replace(iso_code, '-000$', '') AS iso_code
    FROM languages_entry_count_entries_concepts_all_top_10_languages
    WHERE entry_count > 1000 and iso_code LIKE '%-000';
COPY (
    SELECT *
    FROM languages_final
) TO 'data/languages_final.tsv' (HEADER, DELIMITER '\t');

COPY (
    SELECT e.*
    FROM entries_concepts_all_top_10_languages e
    JOIN languages_final l
        ON e.language_id = l.id
) TO 'data/entries_final.tsv' (HEADER, DELIMITER '\t');
