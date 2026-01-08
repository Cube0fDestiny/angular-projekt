let posts = [
  {
    id: 1,
    userId: 1,
    content: "Witajcie w świecie mikroserwisów!",
    createdAt: new Date(),
  },
];

export const getAllPosts = (req, res) => {
  res.json(posts);
};

export const createPost = (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: "Treść posta nie może być pusta" });
  }

  const newPost = {
    id: posts.length + 1,
    userId: req.user.id, // Wyciągnięte z tokena JWT!
    content: content,
    createdAt: new Date(),
  };

  posts.push(newPost);
  console.log(
    `[Post-Service] Dodano post przez użytkownika ID: ${req.user.id}`
  );
  res.status(201).json(newPost);
};
