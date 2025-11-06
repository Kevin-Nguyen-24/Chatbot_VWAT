import pandas as pd
import json
import os

# Define Excel files to convert
excel_files = [
    'data/faq.xlsx',
    'data/VWAT_organise.xlsx',
    'data/vwat_services_master_rag.xlsx'
]

for excel_file in excel_files:
    if not os.path.exists(excel_file):
        print(f"File not found: {excel_file}")
        continue
    
    # Read Excel file
    df = pd.read_excel(excel_file)
    
    # Convert to JSON
    base_name = os.path.splitext(os.path.basename(excel_file))[0]
    json_file = f'data/{base_name}_converted.json'
    
    # Convert DataFrame to list of dictionaries
    data = df.to_dict(orient='records')
    
    # Save as JSON
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Converted {excel_file} to {json_file}")
    print(f"  Rows: {len(data)}")
    print(f"  Columns: {list(df.columns)}\n")
