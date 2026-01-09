export let posts = [
  {
    id: 1,
    userId: 1,
    content: "Witajcie w świecie mikroserwisów!",
    createdAt: new Date(),
    likes: [],
  },
];

export const getAllPosts = async (req, res) => {
  const sortedPosts = [...posts].sort((a, b) => b.createdAt - a.createdAt);
  res.json(sortedPosts);
};

export const createPost = async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ message: "Treść posta nie może być pusta" });
  }
  if (content.length > 500) {
    return res
      .status(400)
      .json({ message: "Post jest za długi (max 500 znaków)" });
  }

  const newPost = {
    id: posts.length + 1,
    userId: req.user.id, // Wyciągnięte z tokena JWT!
    content: content,
    createdAt: new Date(),
    likes: [],
  };

  posts.push(newPost);
  console.log(
    `[Post-Service] Dodano post przez użytkownika ID: ${req.user.id}`
  );
  res.status(201).json(newPost);
};

export const toggleLike = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const post = posts.find((p) => p.id === parseInt(id));

  if (!post) return res.status(404).json({ message: "Post nie znaleziony" });

  const index = post.likes.indexOf(userId);
  if (index === -1) {
    post.likes.push(userId); // Lubię to!
  } else {
    post.likes.splice(index, 1); // Cofnij polubienie
  }

  res.json({
    likesCount: post.likes.length,
    isLiked: post.likes.includes(userId),
  });
};

export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const post = posts.find((p) => p.id === parseInt(id));

  if (!post) {
    return res.status(404).json({ message: "Post nie został znaleziony" });
  }

  post.content = content;
  post.updatedAt = new Date();

  console.log(`[Post-Service] Zaktualizowano post ID: ${id}`);
  res.json({
    message: "Post został zaktualizowany",
    post,
  });
};

export const deletePost = async (req, res) => {
  const { id } = req.params;
  const initialLength = posts.length;
  const index = posts.findIndex((p) => p.id === parseInt(id));

  if (index === -1) {
    return res.status(404).json({ message: "Post nie został znaleziony" });
  }

  posts.splice(index, 1);
  console.log(`[Post-Service] Usunięto post ID: ${id}`);
  res.json({ message: "Post został usunięty" });
};
