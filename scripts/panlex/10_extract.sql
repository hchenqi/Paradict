PRAGMA memory_limit='8GB';
PRAGMA temp_directory='data/duckdb_spill';
PRAGMA threads=4;


-- =========================================================================
-- Import Dataset
-- =========================================================================

CREATE OR REPLACE VIEW panlex_meanings AS
    SELECT * FROM read_parquet('data/00_panlex_meanings.parquet');
    -- SELECT * FROM read_parquet('data/00_panlex_meanings/*.parquet'); -- if in multiple shard files


-- =========================================================================
-- Sanity checks
-- =========================================================================

-- 1) row count & null counts in the columns (all null_* columns should be 0)
COPY (
    SELECT count(*) AS n_rows,
        count(*) FILTER (WHERE langvar IS NULL)     AS null_langvar,
        count(*) FILTER (WHERE txt IS NULL)         AS null_txt,
        count(*) FILTER (WHERE meaning IS NULL)     AS null_meaning,
        count(*) FILTER (WHERE langvar_uid IS NULL) AS null_langvar_uid
    FROM panlex_meanings
) TO 'data/01_stats.tsv' (HEADER, DELIMITER '\t');

-- 2) langvar <-> langvar_uid must be a genuine 1:1 mapping (both queries below should return zero rows)

SELECT langvar, count(DISTINCT langvar_uid) AS distinct_langvar_uids
FROM panlex_meanings GROUP BY langvar HAVING count(DISTINCT langvar_uid) > 1;

SELECT langvar_uid, count(DISTINCT langvar) AS distinct_langvars
FROM panlex_meanings GROUP BY langvar_uid HAVING count(DISTINCT langvar) > 1;


-- =========================================================================
-- Extract
-- =========================================================================

CREATE TEMP TABLE languages AS
    SELECT DISTINCT
        langvar AS id,
        langvar_uid AS code
    FROM panlex_meanings;
COPY (
    SELECT *
    FROM languages
) TO 'data/10_languages.tsv' (HEADER, DELIMITER '\t');

CREATE TEMP TABLE entries AS
    SELECT DISTINCT
        meaning AS concept,
        langvar AS lang,
        txt     AS expr
    FROM panlex_meanings
    WHERE txt IS NOT NULL;
COPY (
    SELECT *
    FROM entries
) TO 'data/10_entries.tsv' (HEADER, DELIMITER '\t');

COPY (
    SELECT 'languages' AS file, count(*) AS count FROM languages
    UNION ALL
    SELECT 'entries', count(*) FROM entries
) TO 'data/11_stats.tsv' (HEADER, DELIMITER '\t');
