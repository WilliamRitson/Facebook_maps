import csv
import json
import os

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

def reformat_file(source, id_map):
    in_file = 'facebook_data/{}'.format(source)
    out_file = 'output/{}'.format(source).replace('csv', 'tsv')
    data, output_headers = extract_data(in_file, ',')

    for country in data:
        name = country['Country']
        if name in id_map:
            country['Id'] = id_map[name]
        else:
            print('No id for', name)

    with open(out_file, 'w', newline='') as csvfile:
        headers = ['Id'] + output_headers
        writer = csv.DictWriter(csvfile, fieldnames=headers, delimiter='\t')
        writer.writeheader()
        for country in data:
            writer.writerow(country)
    
ids, x = extract_data('world_population.tsv', '\t')
id_map = {}
for country in ids:
    id_map[country['name']] = country['id']

for file in os.listdir('facebook_data'):
    print(file) 
    reformat_file(file, id_map)
