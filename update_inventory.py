import os
import json
import datetime

# Configuration
ROOT_DIR = "."
OUTPUT_FILE = "inventory.json"
DIRS_TO_SCAN = [
    {"path": "Tools and Scripts", "type": "tool"},
    {"path": "Guides and Resources", "type": "guide"}
]

# Schema Definition
# tool = {
#   id: string (slug),
#   name: string,
#   description: string,
#   category: string,
#   type: "web" | "script" | "resource",
#   path: string (relative web path),
#   icon: string (emoji or url),
#   tags: list[string],
#   date_added: string
# }

def generate_web_path(local_path):
    # Convert windows paths to web forward slashes
    return local_path.replace("\\", "/").strip("/")

def scan_directory(base_dir, item_type):
    items = []
    if not os.path.exists(base_dir):
        print(f"Warning: Directory {base_dir} not found.")
        return items

    for entry in os.scandir(base_dir):
        if entry.is_dir() and not entry.name.startswith("."):
            item_path = entry.path
            
            # 1. Try to read arsenal.json
            meta_file = os.path.join(item_path, "arsenal.json")
            metadata = {}
            
            if os.path.exists(meta_file):
                try:
                    with open(meta_file, 'r', encoding='utf-8') as f:
                        metadata = json.load(f)
                except Exception as e:
                    print(f"Error reading {meta_file}: {e}")

            # 2. Heuristics / Fallbacks
            # Name
            name = metadata.get("name", entry.name.replace("-", " "))
            
            # Type Detection
            detected_type = "resource"
            files = [f.name.lower() for f in os.scandir(item_path) if f.is_file()]
            
            if "index.html" in files:
                detected_type = "web"
            elif any(f.endswith(".py") for f in files):
                detected_type = "script"
            
            # Override with metadata if present
            final_type = metadata.get("type", detected_type if item_type == "tool" else "resource")

            # Description
            description = metadata.get("description", "No description provided.")
            
            # Category -> Default to Folder name (e.g. Tools and Scripts) or metadata
            category = metadata.get("category", base_dir)

            # Icon
            icon = metadata.get("icon", "⚡")
            if icon == "⚡": # Try heuristic if default
                lower_name = name.lower()
                if "email" in lower_name: icon = "📧"
                elif "event" in lower_name: icon = "🔍"
                elif "net" in lower_name: icon = "📡"
                elif "guide" in lower_name or item_type == "guide": icon = "📚"

            # Launch Path
            launch_path = generate_web_path(item_path)
            if final_type == "web":
                launch_path += "/index.html"

            # Build Object
            item = {
                "id": entry.name,
                "name": name,
                "description": description,
                "category": category,
                "type": final_type,
                "path": launch_path, # Path to open
                "source_path": generate_web_path(item_path), # Path to code
                "icon": icon,
                "tags": metadata.get("tags", [])
            }
            
            items.append(item)
            
    return items

def main():
    print("⚡ Tech Arsenal Indexer Running...")
    
    inventory = {
        "generated_at": datetime.datetime.now().isoformat(),
        "sections": {}
    }

    total_items = 0

    for config in DIRS_TO_SCAN:
        section_name = config["path"]
        print(f"Scanning {section_name}...")
        
        items = scan_directory(section_name, config["type"])
        inventory["sections"][section_name] = items
        total_items += len(items)
        print(f"  -> Found {len(items)} items")

    # Write to file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(inventory, f, indent=2)

    print(f"\n✅ Inventory updated! Total items: {total_items}")
    print(f"📄 Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
