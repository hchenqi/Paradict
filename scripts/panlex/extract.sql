-- ============================================================================
-- PanLex meanings -> normalized CSVs for Postgres load
-- ============================================================================

PRAGMA memory_limit='8GB';                    -- ~60-70% of available RAM
PRAGMA temp_directory='data/duckdb_spill';    -- adjust path
PRAGMA threads=4;                             -- core count

CREATE OR REPLACE VIEW raw AS
    SELECT * FROM read_parquet('data/panlex_meanings.parquet');
    -- if you exported multiple shard files instead of one, use a glob:
    -- SELECT * FROM read_parquet('panlex_meanings/*.parquet');

-- -- ---------------------------------------------------------------------------
-- -- Sanity checks
-- -- ---------------------------------------------------------------------------

-- -- 1) row count + null counts in the columns

-- SELECT count(*) AS n_rows,
--        count(*) FILTER (WHERE langvar IS NULL)     AS null_langvar,
--        count(*) FILTER (WHERE langvar_uid IS NULL) AS null_uid,
--        count(*) FILTER (WHERE meaning IS NULL)     AS null_meaning,
--        count(*) FILTER (WHERE txt IS NULL)         AS null_txt
-- FROM raw;

-- -- null_* columns should be 0 except for null_txt

-- -- 2) langvar -> langvar_uid must be a genuine 1:1 mapping

-- SELECT langvar, count(DISTINCT langvar_uid) AS distinct_uids
-- FROM raw GROUP BY langvar HAVING count(DISTINCT langvar_uid) > 1;

-- SELECT langvar_uid, count(DISTINCT langvar) AS distinct_langvars
-- FROM raw GROUP BY langvar_uid HAVING count(DISTINCT langvar) > 1;

-- -- both queries below should return zero rows

-- ---------------------------------------------------------------------------
-- Extraction
-- ---------------------------------------------------------------------------

COPY (
    SELECT DISTINCT langvar AS id, langvar_uid AS iso_code
    FROM raw
) TO 'data/languages.tsv' (HEADER, DELIMITER '\t');

COPY (
    SELECT DISTINCT meaning AS id
    FROM raw
) TO 'data/concepts.tsv' (HEADER, DELIMITER '\t');

COPY (
    SELECT DISTINCT
        meaning AS concept_id,
        langvar AS language_id,
        txt     AS expression
    FROM raw
    WHERE txt IS NOT NULL
) TO 'data/entries.tsv' (HEADER, DELIMITER '\t');

-- post-checks
SELECT 'languages' AS file, count(*) FROM read_csv('data/languages.tsv', header=true, delim='\t')
UNION ALL
SELECT 'concepts', count(*) FROM read_csv('data/concepts.tsv', header=true, delim='\t')
UNION ALL
SELECT 'entries', count(*) FROM read_csv('data/entries.tsv', header=true, delim='\t');
