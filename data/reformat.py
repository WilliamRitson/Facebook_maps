import csv
import json
import os
import re


range_regex = re.compile('([0-9,]+)\s*-\s*([0-9,]+)')
def parse(str):
    range_match = range_regex.match(str)
    if range_match:
        return (parse(range_match.group(1)) + parse(range_match.group(2))) / 2
    try:
        return float(str.replace('%', '').replace(',', ''))
    except:
        return str

def average(*arg):
    print('avg', arg)
    return sum(arg) / len(arg)

def first(a, b):
    return a

def add(a, b):
    return a + b


merge_ops = [
    ('Id', first),
    ('Country', first),
    ('Preservation Requests', add),
    ('Preservation Accounts Preserved', add),
    ('Total Data Requests', add),
    ('Total Users/Accounts Requested', add),
    ('Percent Requests Where Some Data Produced', average),
    ('Legal Process Request Total', add),
    ('Legal Process Request Total Accounts', add),
    ('Legal Process Request Total Percentage', average),
    ('Emergency Request Total', add),
    ('Emergency Request Total Accounts', add),
    ('Emergency Request Total Percentage', average),
    ('Emergency Disclosures Accounts', add),
    ('Emergency Disclosures', add),
    ('Emergency Disclosures Percentage', average),
    ('Search Warrant', add),
    ('Search Warrant Accounts', add),
    ('Search Warrant Percentage', average),
    ('Subpoena', add),
    ('Subpoena Accounts', add),
    ('Subpoena Percentage', average),
    ('Court Order (Other)', add),
    ('Court Order (Other) Accounts', add),
    ('Court Order (Other) Percentage', average),
    ('Court Order (18 USC 2703(d))', add),
    ('Court Order (18 USC 2703(d)) Accounts', add),
    ('Court Order (18 USC 2703(d)) Percentage', average),
    ('Pen Register/Trap and Trace', add),
    ('Pen Register/Trap and Trace Accounts', add),
    ('Pen Register/Trap and Trace Percentage', average),
    ('Title III,Title III Accounts', add),
    ('Title III Percentage', average),
    ('NSLs', add),
    ('NSLs Accounts', add)
]

def merge_country(c1, c2):
    for key, op in merge_ops:
        if key in c1 and key in c2:
            c1[key] = op(
                parse(c1[key]), 
                parse(c2[key])
            )
        elif key in c1:
            c1[key] = parse(c1[key])
        elif key in c2:
            c1[key] = parse(c2[key])
        else:
            c1[key] = ''
    return c1


def merge_sets(d1, d2):
    results = []
    d2_map = {}

    for country in d2:
        d2_map[country['Country']] = country

    for country in d1:
        name = country['Country']
        if name in d2_map:
            results.append(merge_country(country, d2_map[name]))
            d2_map.pop(name)
        else:
            results.append(country)
    
    for name in d2_map:
        results.append(d2_map[name])

    return results

def extract_data(fn, seperator):
    with open(fn, encoding='utf-8-sig') as csvfile:
        data_reader = csv.reader(csvfile, delimiter=seperator)
        header = next(data_reader)
        data = []
        for row in data_reader:
            
            point = {}
            for i in range(len(header)):
                point[header[i]] = row[i]
            data.append(point)
        return data, header

def add_ids(data, id_map):

    for country in data:
        name = country['Country']
        if name in id_map:
            country['Id'] = id_map[name]
        else:
            print('No id for', name)

def output_file(data, filename, headers):
    with open(filename, 'w', newline='') as tsv:
        writer = csv.DictWriter(tsv, fieldnames=headers, delimiter='\t')
        writer.writeheader()
        for country in data:
            writer.writerow(country)
    
ids, x = extract_data('world_population.tsv', '\t')
id_map = {}
for country in ids:
    id_map[country['name']] = country['id']


d1, h1 = extract_data('./facebook_data/Data Requests-2013-H1.csv', ',')
d2, h2 = extract_data('./facebook_data/Data Requests-2013-H2.csv', ',')
merged = merge_sets(d1, d2)
add_ids(merged, id_map)

headers = []
for key, op in merge_ops:
    headers.append(key)

#headers = ['Id'] + list(merge_ops.keys())
output_file(merged, './output/Data Requests-2013.tsv', headers)

#for file in os.listdir('facebook_data'):
#    print(file) 
#    reformat_file(file, id_map)
