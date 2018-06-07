import csv
import json
import os
import re
import sys
import os

print(sys.version)


abspath = os.path.abspath(__file__)
dname = os.path.dirname(abspath)
os.chdir(dname)

range_regex = re.compile('([0-9,]+)\s*-\s*([0-9,]+)')
def parse(str):
    range_match = range_regex.match(str)
    if range_match:
        return (parse(range_match.group(1)) + parse(range_match.group(2))) / 2
    try:
        return float(str.replace('%', '').replace(',', ''))
    except:
        return str.replace('%', '')

def average(*arg):
    return sum(arg) / len(arg)

def first(a, b):
    return a

def add(a, b):
    return a + b


merge_ops = [
    ('id', first),
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
    ('Title III', add), 
    ('Title III Accounts', add),
    ('NSLs', add),
    ('NSLs Accounts', add)
]

def parse_country(c):
    for key, op in merge_ops:
        if key in c and c[key] != '':
            c[key] = parse(c[key])
        else:
            c[key] = ''
    return c
    
def merge_country(c1, c2):
    for key, op in merge_ops:
        if key in c1 and c1[key] != '' and key in c2 and c2[key] != '':
            c1[key] = op(
                parse(c1[key]), 
                parse(c2[key])
            )
        elif key in c1 and c1[key] != '':
            c1[key] = parse(c1[key])
        elif key in c2 and c2[key] != '':
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
            results.append(parse_country(country))
    
    for name in d2_map:
        results.append(parse_country(d2_map[name]))

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
            country['id'] = id_map[name]
        else:
            print('No id for', name)

def output_file(data, filename, headers):
    with open(filename, 'w', newline='') as tsv:
        writer = csv.DictWriter(tsv, fieldnames=headers, delimiter='\t')
        writer.writeheader()
        for country in data:
            writer.writerow(country)
    
ids, x = extract_data('./world_population.tsv', '\t')
id_map = {}
for country in ids:
    id_map[country['name']] = country['id']


sources = [
    {
        'dir': 'facebook_data',
        'out_dir': 'facebook_output',
        'files': [{
            'inputs': ['Data Requests-2013-H1.csv', 'Data Requests-2013-H2.csv'],
            'output': 'Data Requests-2013.tsv'
        },{
            'inputs': ['Data Requests-2014-H1.csv', 'Data Requests-2014-H2.csv'],
            'output': 'Data Requests-2014.tsv'
        },{
            'inputs': ['Data Requests-2015-H1.csv', 'Data Requests-2015-H2.csv'],
            'output': 'Data Requests-2015.tsv'
        },{
            'inputs': ['Data Requests-2016-H1.csv', 'Data Requests-2016-H2.csv'],
            'output': 'Data Requests-2016.tsv'
        },{
            'inputs': ['Data Requests-2017-H1.csv', 'Data Requests-2017-H2.csv'],
            'output': 'Data Requests-2017.tsv'
        }]
    }
]


for source in sources:
    if not os.path.exists(source['out_dir']):
        os.makedirs(source['out_dir'])
        
    all = []
    year = 2013
    for file in source['files']:
        
        d1, h1 = extract_data(source['dir'] + '/' + file['inputs'][0], ',')
        d2, h2 = extract_data(source['dir'] + '/' + file['inputs'][1], ',')
        merged = merge_sets(d1, d2)
        add_ids(merged, id_map)
        
        for country in merged:
            country_with_year = country.copy()
            country_with_year['Year'] = year
            all.append(country_with_year)

        headers = []
        for key, op in merge_ops:
            headers.append(key)
        
        output_file(merged, source['out_dir'] + '/' + file['output'], headers)
        year += 1
    output_file(all, source['out_dir'] + '/' + 'all.tsv', ['Year'] + headers)

