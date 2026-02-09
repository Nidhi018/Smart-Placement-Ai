import kagglehub
import os

# Download latest version
path = kagglehub.dataset_download("snehaanbhawal/resume-dataset")

print("Path to dataset files:", path)

# Move the dataset to our data folder for easier access
import shutil
destination = os.path.join(os.getcwd(), "..", "data", "resume_dataset")
if not os.path.exists(destination):
    shutil.copytree(path, destination)
    print(f"Dataset copied to {destination}")
else:
    print(f"Dataset already exists at {destination}")
