import duckdb
import unicodedata

con = duckdb.connect()

con.execute("""
    CREATE TABLE t AS
    SELECT * FROM read_csv('data/entries.tsv', header = true, delim='\t')
""")

con.create_function(
    "normalize_nfc",
    lambda s: unicodedata.normalize("NFC", s),
    ["VARCHAR"],
    "VARCHAR"
)

count = con.execute(f"""
	SELECT COUNT(*)
	FROM t
	WHERE expr != normalize_nfc(expr)
""").fetchone()[0]

if count > 0:
	con.execute(f"""
		UPDATE t
		SET expr = normalize_nfc(expr)
		WHERE expr != normalize_nfc(expr)
	""")

	con.execute("""
		COPY t TO 'data/entries.tsv' (HEADER, DELIMITER '\t')
	""")
