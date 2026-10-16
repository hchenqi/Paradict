from dataset import *
from dedup import *
from filter import *

# import dataset
dataset = import_dataset()
languages = dataset["languages"]
entries = dataset["entries"]

# filter
language_count = languages_stats(languages, entries)
concepts = concepts_all_top_languages(entries, language_count, 7)
entries = entries_of_concepts(entries, concepts)
language_count = languages_stats(languages, entries)
languages = languages_enough_entries(language_count, 5000)
entries = entries_of_languages(entries, languages)

# dedup
mapping = build_mapping(entries)
concept_eid = mapping["concept_eid"]
concept_eid = dedup_exact(concept_eid, 20)
concept_eid = dedup_overlapping(concept_eid, 3, 0.2, 0.8)
#map_stats(concept_eid)["concept_count"].evaluate()
concepts = concepts_distinct(concept_eid)
entries = restore_from_mapping(concept_eid, mapping["eid_lang_expr"])

# output tables
export_tables(concepts, languages, entries).evaluate()
#prune(concepts, languages, entries)
