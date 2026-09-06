import zipfile
import xml.etree.ElementTree as ET
import re
import json
import os

with zipfile.ZipFile('GIA PHẢ HỌ PHẠM VĂN.docx') as z:
    xml_content = z.read('word/document.xml')

root = ET.fromstring(xml_content)
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

table = root.find('.//w:tbl', ns)
rows = table.findall('.//w:tr', ns)

def parse_death_date(death_str):
    if not death_str:
        return None, None, None, ""
    
    s = death_str.strip()
    notes = []
    
    # Extract tho / huong duong
    tho_match = re.search(r'(Thọ|Hưởng thọ|Hưởng dương|HD:?)\s*(\d+)', s, re.IGNORECASE)
    if tho_match:
        notes.append(f"{tho_match.group(1)} {tho_match.group(2)}")
        s = s[:tho_match.start()] + s[tho_match.end():]
        
    s = s.strip().strip('-–/|, ')
    
    # Check for DD-MM-YYYY or DD/MM/YYYY
    dmy_match = re.search(r'(\d{1,2})\s*[-–/]\s*(\d{1,2})\s*[-–/]\s*(\d{4})', s)
    if dmy_match:
        day = int(dmy_match.group(1))
        month = int(dmy_match.group(2))
        year = int(dmy_match.group(3))
        return day, month, year, " | ".join(notes)
        
    # Check for DD / MM or DD - MM
    s_clean = re.sub(r'(\d)\s+(\d)', r'\1\2', s)
    dm_match = re.search(r'(\d{1,2})\s*[-–/]\s*(\d{1,2})', s_clean)
    if dm_match:
        day = int(dm_match.group(1))
        month = int(dm_match.group(2))
        if 1 <= day <= 31 and 1 <= month <= 12:
            return day, month, None, " | ".join(notes)
            
    # If year only
    y_match = re.search(r'\b(1[789]\d{2}|20\d{2})\b', s)
    if y_match:
        return None, None, int(y_match.group(1)), " | ".join(notes)
        
    if s:
        notes.append(s)
    return None, None, None, " | ".join(notes)

current_gen = 1
raw_entries = []

for r_idx, row in enumerate(rows):
    cells = row.findall('.//w:tc', ns)
    c_texts = [" ".join("".join([n.text for n in c.findall('.//w:t', ns) if n.text]).split()) for c in cells]
    
    full_row_text = " ".join(c_texts).strip()
    gen_match = re.search(r'ĐỜI\s+THỨ\s+(\d+)', full_row_text, re.IGNORECASE)
    if gen_match:
        current_gen = int(gen_match.group(1))
        continue
        
    if len(c_texts) < 2 or "HỌ VÀ TÊN" in full_row_text:
        continue
        
    raw_name = c_texts[1].strip()
    if not raw_name:
        continue
        
    birth_str = c_texts[2].strip() if len(c_texts) > 2 else ""
    hometown = c_texts[3].strip() if len(c_texts) > 3 else ""
    death_str = c_texts[4].strip() if len(c_texts) > 4 else ""
    
    raw_entries.append({
        "generation": current_gen,
        "raw_name": raw_name,
        "birth_str": birth_str,
        "hometown": hometown,
        "death_str": death_str
    })

members = []
stt_counter = 1
last_primary_idx = None
last_primary_gender = None

for entry in raw_entries:
    gen = entry["generation"]
    raw_name = entry["raw_name"]
    birth_str = entry["birth_str"]
    hometown = entry["hometown"]
    death_str = entry["death_str"]
    
    lunar_day, lunar_month, death_solar_year, death_extra_notes = parse_death_date(death_str)
    
    # Parse birth year
    birth_year = None
    by_match = re.search(r'\b(1[789]\d{2}|20\d{2})\b', birth_str)
    if by_match:
        birth_year = int(by_match.group(1))
        
    notes_parts = []
    if hometown:
        notes_parts.append(f"Quê quán/Ghi chú: {hometown}")
    if death_extra_notes:
        notes_parts.append(death_extra_notes)
        
    # Check if this is a spouse
    is_wife = bool(re.match(r'^(Vợ cả|Vợ hai|Vợ ba|Vợ tư|Vợ)\s*:?', raw_name, re.IGNORECASE))
    is_husband = bool(re.match(r'^Chồng\s*:?', raw_name, re.IGNORECASE))
    
    if is_wife:
        spouse_role_match = re.match(r'^(Vợ cả|Vợ hai|Vợ ba|Vợ tư|Vợ)\s*:?\s*(.*)$', raw_name, re.IGNORECASE)
        spouse_role = spouse_role_match.group(1) if spouse_role_match else "Vợ"
        clean_name = spouse_role_match.group(2).strip() if spouse_role_match else ""
        
        husband_name = members[last_primary_idx]["fullName"] if last_primary_idx is not None else ""
        if not clean_name:
            clean_name = f"Bà ({spouse_role} Cụ {husband_name})" if husband_name else f"Bà ({spouse_role})"
            
        notes_parts.insert(0, f"Quan hệ: {spouse_role}")
        
        # Life status
        if gen <= 10 or death_str or any("thọ" in p.lower() or "mất" in p.lower() or "chết" in p.lower() for p in notes_parts):
            life_status = "Đã mất"
        else:
            life_status = "Còn sống"
            
        member = {
            "stt": stt_counter,
            "fullName": clean_name,
            "gender": "Nữ",
            "lifeStatus": life_status,
            "fatherStt": None,
            "motherStt": None,
            "spouseStt": members[last_primary_idx]["stt"] if last_primary_idx is not None else None,
            "birthYear": birth_year,
            "deathLunarDay": lunar_day,
            "deathLunarMonth": lunar_month,
            "deathLunarIsLeap": "S",
            "deathLunarYearName": "",
            "deathSolarYear": death_solar_year,
            "birthOrder": None,
            "isSenior": "S",
            "isAdopted": "S",
            "isRoot": "S",
            "burialLocation": "",
            "notes": " | ".join(notes_parts),
            "generation": gen
        }
        members.append(member)
        
        # Set reciprocal spouse on husband if husband doesn't have one yet or husband is the primary
        if last_primary_idx is not None and not members[last_primary_idx]["spouseStt"]:
            members[last_primary_idx]["spouseStt"] = stt_counter
            
        stt_counter += 1
        
    elif is_husband:
        spouse_role_match = re.match(r'^Chồng\s*:?\s*(.*)$', raw_name, re.IGNORECASE)
        clean_name = spouse_role_match.group(1).strip() if spouse_role_match else ""
        
        wife_name = members[last_primary_idx]["fullName"] if last_primary_idx is not None else ""
        if not clean_name:
            clean_name = f"Ông (Chồng Bà {wife_name})" if wife_name else "Ông (Chồng)"
            
        notes_parts.insert(0, "Quan hệ: Chồng")
        
        if gen <= 10 or death_str or any("thọ" in p.lower() or "mất" in p.lower() or "chết" in p.lower() for p in notes_parts):
            life_status = "Đã mất"
        else:
            life_status = "Còn sống"
            
        member = {
            "stt": stt_counter,
            "fullName": clean_name,
            "gender": "Nam",
            "lifeStatus": life_status,
            "fatherStt": None,
            "motherStt": None,
            "spouseStt": members[last_primary_idx]["stt"] if last_primary_idx is not None else None,
            "birthYear": birth_year,
            "deathLunarDay": lunar_day,
            "deathLunarMonth": lunar_month,
            "deathLunarIsLeap": "S",
            "deathLunarYearName": "",
            "deathSolarYear": death_solar_year,
            "birthOrder": None,
            "isSenior": "S",
            "isAdopted": "S",
            "isRoot": "S",
            "burialLocation": "",
            "notes": " | ".join(notes_parts),
            "generation": gen
        }
        members.append(member)
        
        if last_primary_idx is not None and not members[last_primary_idx]["spouseStt"]:
            members[last_primary_idx]["spouseStt"] = stt_counter
            
        stt_counter += 1
        
    else:
        # Primary clan member (nam hoặc nữ họ Phạm)
        # Check gender: female if name starts with "Phạm Thị" or "Thị"
        is_female = bool(re.search(r'\b(Thị)\b', raw_name))
        gender = "Nữ" if is_female else "Nam"
        
        if gen <= 10 or death_str or any("thọ" in p.lower() or "mất" in p.lower() or "chết" in p.lower() for p in notes_parts):
            life_status = "Đã mất"
        else:
            life_status = "Còn sống"
            
        current_idx = len(members)
        is_root_val = "Đ" if gen == 1 and "Phạm Văn Chiến" in raw_name else "S"
        
        member = {
            "stt": stt_counter,
            "fullName": raw_name,
            "gender": gender,
            "lifeStatus": life_status,
            "fatherStt": None,
            "motherStt": None,
            "spouseStt": None,
            "birthYear": birth_year,
            "deathLunarDay": lunar_day,
            "deathLunarMonth": lunar_month,
            "deathLunarIsLeap": "S",
            "deathLunarYearName": "",
            "deathSolarYear": death_solar_year,
            "birthOrder": None,
            "isSenior": "S",
            "isAdopted": "S",
            "isRoot": is_root_val,
            "burialLocation": "",
            "notes": f"Đời thứ {gen}" + (f" | {' | '.join(notes_parts)}" if notes_parts else ""),
            "generation": gen
        }
        members.append(member)
        last_primary_idx = current_idx
        last_primary_gender = gender
        stt_counter += 1

# Link Generations 1 to 4:
# Find Cụ Chiến, Cụ Đồng, Cụ Chức, Cụ Tường
chien_stt = next((m["stt"] for m in members if "Phạm Văn Chiến" in m["fullName"]), None)
dong_stt = next((m["stt"] for m in members if "Phạm Văn Đồng" in m["fullName"]), None)
chuc_stt = next((m["stt"] for m in members if "Phạm Kim Chức" in m["fullName"]), None)
tuong_stt = next((m["stt"] for m in members if "Phạm Khắc Tường" in m["fullName"]), None)

if dong_stt and chien_stt:
    for m in members:
        if m["stt"] == dong_stt:
            m["fatherStt"] = chien_stt
if chuc_stt and dong_stt:
    for m in members:
        if m["stt"] == chuc_stt:
            m["fatherStt"] = dong_stt
if tuong_stt and chuc_stt:
    for m in members:
        if m["stt"] == tuong_stt:
            m["fatherStt"] = chuc_stt

print(f"Extraction summary:")
print(f"Total processed members: {len(members)}")
print(f"Cụ Thủy Tổ Chiến STT: {chien_stt}")
print(f"Cụ Đồng (Đời 2) STT: {dong_stt}, fatherStt: {next(m['fatherStt'] for m in members if m['stt'] == dong_stt)}")
print(f"Cụ Chức (Đời 3) STT: {chuc_stt}, fatherStt: {next(m['fatherStt'] for m in members if m['stt'] == chuc_stt)}")
print(f"Cụ Tường (Đời 4) STT: {tuong_stt}, fatherStt: {next(m['fatherStt'] for m in members if m['stt'] == tuong_stt)}")

os.makedirs('scratch', exist_ok=True)
with open('scratch/extracted_members.json', 'w', encoding='utf-8') as f:
    json.dump(members, f, ensure_ascii=False, indent=2)

print("Saved to scratch/extracted_members.json successfully.")
