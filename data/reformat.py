import csv
import json
import os
import re
import sys
import os




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


output_fields = ['year', 'id', 'country', 'requests', 'accounts', 'percentAccepted']
facebook_output_map = {
    'year': 'year', 
    'Year': 'year', 
    'id': 'id', 
    'Country': 'country', 
    'Total Data Requests': 'requests', 
    'Total Users/Accounts Requested': 'accounts', 
    'Percent Requests Where Some Data Produced': 'percentAccepted'
}


google_output_map = {
    'Year': 'year',
    'Country': 'country',
    'User Data Requests': 'requests',
    'Users/Accounts Specified': 'accounts',
    'Percentage of requests where some data produced': 'percentAccepted',
}

def remap_fields(data, remap):
    
    for datum in data:
        keys = list(datum.keys())
        for key in keys:
            if key in remap and key != remap[key]:
                datum[remap[key]] =  datum[key]
                datum.pop(key)
            



merge_ops = [
    ('id', first),
    ('Country', first),
    ('Total Data Requests', add),
    ('Total Users/Accounts Requested', add),
    ('Percent Requests Where Some Data Produced', average)
]

def parse_country(c):
    result = {}
    for key, op in merge_ops:
        if key in c and c[key] != '':
            result[key] = parse(c[key])
        else:
            result[key] = ''
    return result
    
def merge_country(c1, c2):
    result = {}
    for key, op in merge_ops:
        if key in c1 and c1[key] != '' and key in c2 and c2[key] != '':
            result[key] = op(
                parse(c1[key]), 
                parse(c2[key])
            )
        elif key in c1 and c1[key] != '':
            result[key] = parse(c1[key])
        elif key in c2 and c2[key] != '':
            result[key] = parse(c2[key])
        else:
            result[key] = ''
    return result


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
        
    all_facebook = []
    year = 2013
    for file in source['files']:
        
        d1, h1 = extract_data(source['dir'] + '/' + file['inputs'][0], ',')
        d2, h2 = extract_data(source['dir'] + '/' + file['inputs'][1], ',')
        merged = merge_sets(d1, d2)
        add_ids(merged, id_map)
        
        for country in merged:
            country_with_year = country.copy()
            country_with_year['Year'] = year
            all_facebook.append(country_with_year)

        headers = []
        for key, op in merge_ops:
            headers.append(key)
        
        output_file(merged, source['out_dir'] + '/' + file['output'], headers)
        year += 1

    remap_fields(all_facebook, facebook_output_map)
    output_file(all_facebook, source['out_dir'] + '/' + 'all_facebook.tsv', output_fields)

# Google data
if not os.path.exists('google_output'):
    os.makedirs('google_output')

google_data, google_headers = extract_data('google_data/google-user-data-requests.csv', ',')

rename = {
    "Czechia": "Czech Republic",
    "Bosnia & Herzegovina": "Bosnia and Herzegovina",
    "Macedonia (FYROM)": "Macedonia",
    "Sint Maarten": "Saint Martin",
    "Côte d’Ivoire": "Ivory Coast",
    "Trinidad & Tobago": "Trinidad and Tobago"
}
fields_to_remove = ['Period Ending', 'CLDR Territory Code', 'Legal Process']

year_pattern = re.compile('([0-9]+)-[0-9]+-[0-9]+')
countries_once = {}
for country in google_data:
    if country['Country'] in rename:
        country['Country'] = rename[country['Country']]
    
    country['Year'] = year_pattern.match(country['Period Ending']).group(1)

    key = country['Year'] + country['Country']
    if not key in countries_once:
        countries_once[key] = country
        reqs = int(country['User Data Requests'])
        country['User Data Requests'] = reqs
        country['Users/Accounts Specified'] = int(country['Users/Accounts Specified'] or 0)
        percantage = int(country['Percentage of requests where some data produced'] or '0')
        country['rejected']  = reqs * (1 -  percantage/ 100)
    else:
        existing = countries_once[key]
        reqs = int(country['User Data Requests'])
        existing['User Data Requests'] += reqs
        existing['Users/Accounts Specified'] = existing['Users/Accounts Specified'] + int(country['Users/Accounts Specified'] or 0)
    
for country_key in countries_once:
    country = countries_once[country_key]
    reqs = int(country['User Data Requests'])
    rej = int(country['rejected'] or '0')
    if rej != 0:
        country['percentAccepted'] = rej / reqs
    else:
        country['percentAccepted'] = 0
    country.pop( 'rejected')
    for field in fields_to_remove:
        country.pop(field)

google_data = countries_once.values()

headers = ['id', 'Year'] + google_headers
for field in fields_to_remove:
    headers.remove(field)
    
add_ids(google_data, id_map)
remap_fields(google_data, google_output_map)

fields = set()
for country in google_data:
    fields.update(country.keys())

output_file(google_data, 'google_output/all_google.tsv', output_fields)
