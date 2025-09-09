-- Sample SQL to create some basic tables in your Supabase database
-- Run these in your Supabase SQL Editor

-- Create a users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    author_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a products table
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some sample data
INSERT INTO users (email, name) VALUES 
    ('john@example.com', 'John Doe'),
    ('jane@example.com', 'Jane Smith'),
    ('bob@example.com', 'Bob Johnson')
ON CONFLICT (email) DO NOTHING;

INSERT INTO posts (title, content, author_id) VALUES 
    ('Welcome to our blog', 'This is our first post!', (SELECT id FROM users WHERE email = 'john@example.com')),
    ('Getting started with Supabase', 'Here are some tips for using Supabase...', (SELECT id FROM users WHERE email = 'jane@example.com')),
    ('Building React apps', 'React is a great framework for building UIs', (SELECT id FROM users WHERE email = 'bob@example.com'))
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, stock_quantity) VALUES 
    ('Laptop', 'High-performance laptop for developers', 1299.99, 10),
    ('Mouse', 'Wireless optical mouse', 29.99, 50),
    ('Keyboard', 'Mechanical keyboard with RGB lighting', 149.99, 25)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) for better security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (for demo purposes)
CREATE POLICY "Allow public read access on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read access on posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Allow public read access on products" ON products FOR SELECT USING (true);
