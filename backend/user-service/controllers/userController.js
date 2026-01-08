import bcrypt from "bcrypt";

// Dane w pamięci
let users = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    password: "password",
    role: "admin",
    avatar: "https://i.pravatar.cc/150?img=1",
    status: "online",
    bio: "Angular Lover",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    password: "password",
    role: "user",
    avatar: "https://i.pravatar.cc/150?img=2",
    status: "away",
    bio: "UX Designer",
  },
];

export const getAllUsers = (req, res) => {
  const safeUsers = users.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
  
  res.json(safeUsers);
};

export const getUserProfile = (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id));
  
  if (!user) {
    return res.status(404).json({ message: "Użytkownik nie istnieje" });
  }

  const { password, ...userWithoutPassword } = user;
  
  console.log(`[User-Service] Pobrano bezpieczny profil dla ID: ${req.params.id}`);
  res.json(userWithoutPassword);
};

export const register = async (req, res) => {
  const { name, email, password, avatar } = req.body;

  const existingUser = user.find((u) => u.email === email);
  if (existingUser)
    return res
      .status(400)
      .json({ message: "Użytkownik o tym adresie email już istnieje" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: users.length + 1,
    name,
    email,
    password: hashedPassword,
    role: "user",
    avatar: avatar || `https://i.pravatar.cc/150?u=${email}`,
    status: "online",
    bio: "",
  };

  users.push(newUser);

  const { password: _, ...userWithoutPassword } = newUser;

  console.log(`[User-Service] Zarejestrowano nowego użytkownika ID: ${newUser.id}`);
  res.status(201).json(newUser);
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);

  if (!user) return res.status(401).json({ message: "Nieprawidłowe dane logowania" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Nieprawidłowe dane logowania" });

  const { password: _, ...userWithoutPassword } = user;
  
  console.log(`[User-Service] Zalogowano ID: ${user.id}`);
  res.json(userWithoutPassword);
};

export const updateProfile = (req, res) => {
  const { id } = req.params;
  const { name, bio, location, avatar, status } = req.body;

  const index = users.findIndex(u => u.id === parseInt(id));

  if (index === -1) {
    return res.status(404).json({ message: "Użytkownik nie znaleziony" });
  }

  // Aktualizujemy tylko te pola, które przyszły w żądaniu (tzw. partial update)
  users[index] = {
    ...users[index],
    name: name || users[index].name,
    bio: bio ?? users[index].bio,
    location: location ?? users[index].location,
    avatar: avatar || users[index].avatar,
    status: status || users[index].status
  };

  console.log(`[User-Service] Zaktualizowano profil ID: ${id}`);
  
  const { password, ...userWithoutPassword } = users[index];
  res.json(userWithoutPassword);
};

export const deleteUser = (req, res) => {
  const { id } = req.params;
  const initialLength = users.length;
  
  users = users.filter(u => u.id !== parseInt(id));

  if (users.length === initialLength) {
    return res.status(404).json({ message: "Nie znaleziono użytkownika do usunięcia" });
  }

  console.log(`[User-Service] Usunięto użytkownika ID: ${id}`);
  res.status(204).send(); // 204 No Content - sukces bez zwracania danych
};