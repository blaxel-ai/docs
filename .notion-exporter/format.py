import json
import os
import shutil
import re

page = os.getenv("NOTION_PAGE", "111a77bf59b480d9b0ebfe5b3743e768")

def copy_file(file_path, file_name, destination_folder):
  splitted_path = file_path.split("/")
  real_path = ""

  for part in splitted_path:
    part_without_id = re.sub(r'[a-f0-9]{32}', '', part)
    contain_extension = "." in part_without_id
    if contain_extension:
      real_path += part_without_id + "/"
    else:
      real_path += part_without_id[0:-1] + "/"
  real_path = real_path[0:-1]
  real_path = real_path.replace(" .md", ".md")

  dest_dir = os.path.join(destination_folder, os.path.dirname(real_path))
  os.makedirs(dest_dir, exist_ok=True)

  # Construct the destination file path
  dest_file = os.path.join(destination_folder, f"{real_path}")

  if dest_file.endswith("mint json.md"):
    return handleMintJson(destination_folder, file_path)
  # Copy the file
  if dest_file.endswith(".md"):
    dest_file = dest_file.replace(".md", ".mdx")

  shutil.copy2(file_path, dest_file)
  return real_path

def handleMintJson(destination_folder, real_path):
  print("handleMintJson", real_path)
  with open(real_path, "r", encoding="utf-8") as f:
    content = f.read()
    # Extract the JSON content between the ```json and ``` markers
    json_content = re.search(r'```json\n(.*?)\n```', content, re.DOTALL)
    if json_content:
        mint = json.loads(json_content.group(1))
        destination_file = os.path.join(destination_folder, "mint.json")
        with open(destination_file, "w", encoding="utf-8") as f:
          json.dump(mint, f, indent=2)
    else:
        print("Failed to extract JSON content")
  return "mint.json"

def rewrite_links(file_path):
  is_different = True
  while is_different:
    with open(file_path, 'r', encoding='utf-8') as f:
      content = f.read()
    # Regex pattern to match the unwanted part
    pattern = r'(.*)%20([a-f0-9]{32})([\/\.].*)'

    # Replace using regex
    result = re.sub(pattern, r'\1\3', content)

    # Write the modified content back to the file
    if content != result:
      with open(file_path, 'w', encoding='utf-8') as f:
        f.write(result)
    else:
      is_different = False

def rewrite_title(file_path):
  with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

  # Regex pattern to match the title
  pattern = r'^# (.*)'
  title = re.search(pattern, content, re.MULTILINE)
  if title:
    print("rewrite_title", file_path, title.group(1))
    # Remove the title line from content
    new_content = re.sub(pattern, '', content, 1)
    # Remove empty lines at the start until we hit ---
    while new_content.startswith('\n'):
        new_content = new_content[1:]

    # Replace quotes until we hit the second ---
    first_separator = new_content.find('---')
    if first_separator != -1:
        second_separator = new_content.find('---', first_separator + 3)
        if second_separator != -1:
            # Get the content between the separators
            front_matter = new_content[first_separator:second_separator + 3]
            # Replace quotes in front matter
            front_matter = front_matter.replace('“', "\"")
            front_matter = front_matter.replace('”', "\"")
            front_matter = front_matter.replace('‘', "'")
            front_matter = front_matter.replace('’', "'")
            # Reconstruct the content
            new_content = new_content[:first_separator] + front_matter + new_content[second_separator + 3:]
    # Write the modified content back to the file
    if content != new_content:
      with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

def process_export_folder():
  os.chdir(f"export/Documentation {page}/")

  destination_folder = "../.."
  if os.getenv("DEBUG"):
    destination_folder = "../../debug"
  for root, _, files in os.walk("./"):
    for file in files:
      file_path = os.path.join(root, file)
      new_path = copy_file(file_path, file, destination_folder)
      print(f"File: {new_path} created")

  # Loop through all files in the destination folder
  for root, _, files in os.walk(destination_folder):
    for file in files:
      file_path = os.path.join(root, file)
      # Check if it's a markdown file
      if file.endswith('.mdx'):
        rewrite_title(file_path)
        rewrite_links(file_path)

if __name__ == "__main__":
  process_export_folder()