from datasets import load_dataset

ds = load_dataset("cointegrated/panlex-meanings", "default", split='train')
print(ds)

ds.to_parquet("data/00_panlex_meanings.parquet")
