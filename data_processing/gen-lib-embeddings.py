import pandas as pd
from sklearn.manifold import TSNE
from sentence_transformers import SentenceTransformer

# Load local CSV
df = pd.read_csv("network-library.csv")

# Concatenate description, title, author, and discipline for model input
book_data = (
    df["description"].fillna("")
    + " "
    + df["title"].fillna("")
    + " "
    + df["discipline"].fillna("")
).tolist()

# Load pre-trained model
model = SentenceTransformer("all-MiniLM-L6-v2")

# Generate embeddings
embeddings = model.encode(book_data)

# Apply t-SNE to reduce embeddings to 2D
tsne = TSNE(n_components=2, random_state=42, perplexity=min(5, len(embeddings) - 1))
embeddings_2d = tsne.fit_transform(embeddings)

# Write 2d embeddings to DataFrame
df["embedding_2d"] = [emb2d.tolist() for emb2d in embeddings_2d]

# Save to CSV (overwrites original file)
df.to_csv("network-library.csv", index=False)
print("Embeddings generated and saved to network-library.csv")
