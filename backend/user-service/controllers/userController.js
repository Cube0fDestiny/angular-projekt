// Dane w pamięci
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', password: 'password', role: 'admin', avatar: 'https://i.pravatar.cc/150?img=1', status: 'online', bio: 'Angular Lover' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', password: 'password', role: 'user', avatar: 'https://i.pravatar.cc/150?img=2', status: 'away', bio: 'UX Designer' }
];

export const getAllUsers = (req, res) => {
  res.json(users);
};

export const getUserProfile = (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ message: "Użytkownik nie istnieje" });
  res.json(user);
};

export const register = (req, res) => {
  const { name, email, password, avatar } = req.body;
  const newUser = {
    id: users.length + 1,
    name, email, password,
    role: 'user',
    avatar: avatar || `https://i.pravatar.cc/150?u=${email}`,
    status: 'online',
    bio: ''
  };
  users.push(newUser);
  res.status(201).json(newUser);
};

export const login = (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: "Błędny email lub hasło" });
  
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
};