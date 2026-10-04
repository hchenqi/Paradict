from datasets import load_dataset

ds = load_dataset("cointegrated/panlex-meanings", "default", split='train')
print(ds)

ds.to_parquet("data/panlex_meanings.parquet")
