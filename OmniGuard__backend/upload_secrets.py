from huggingface_hub import HfApi

api = HfApi()
repo_id = "hrishikeshdutta/OmniGuard-API"

print("Uploading to", repo_id)

files_to_upload = [
    "server/server.js",
    "server/Dockerfile",
    "server/README.md"
]

for file in files_to_upload:
    print(f"Uploading {file}...")
    api.upload_file(
        path_or_fileobj=file,
        path_in_repo=file.replace("server/", ""),
        repo_id=repo_id,
        repo_type="space"
    )

print("Upload successful!")
