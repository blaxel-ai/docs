import os
from dotenv import load_dotenv

load_dotenv()

from notion_exporter import ExportType, NotionExporter, ViewExportType

notion_token = os.getenv("NOTION_TOKEN")
notion_file_token = os.getenv("NOTION_FILE_TOKEN")
page = os.getenv("NOTION_PAGE", "13847e47b1ea80b389c8cfcfa90d34f9")

if __name__ == "__main__":
    exporter = NotionExporter(
        token_v2=notion_token,
        file_token=notion_file_token,
        pages={"Product Documentation": page},
        export_directory=".",
        export_name="export",
        flatten_export_file_tree=False,
        export_type=ExportType.MARKDOWN,
        current_view_export_type=ViewExportType.CURRENT_VIEW,
        include_files=True,
        recursive=True
    )
    exporter.process()