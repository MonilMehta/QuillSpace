import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import {decode,sign,verify} from 'hono/jwt'

// Middleware for authentication
async function authMiddleware(c: any, next: any) {
  const header = c.req.header("Authorization");
  if (!header) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const token = header.split(" ")[1];
  
  try {
    const payload = await verify(token, 'secret');
    c.set('jwtPayload', payload);
    await next();
  } catch (error) {
    return c.json({ error: "unauthorized" }, 401);
  }
}

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string,
    CLOUDINARY_CLOUD_NAME: string,
    CLOUDINARY_API_KEY: string,
    CLOUDINARY_API_SECRET: string
  }
  Variables: {
    jwtPayload: {
      id: string
    }
  }
}>();
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length', 'X-Kuma-Revision']
}));

app.get('/', async (c) => {
  return c.json({ message: 'Hello World' })
})

app.post('/api/v1/signup', async (c) => {
  try {
    // Verify content type
    const contentType = c.req.header('Content-Type')
    if (!contentType || !contentType.includes('application/json')) {
      return c.json({ error: 'Content-Type must be application/json' }, 400)
    }

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: c.env.DATABASE_URL,
        },
      },
    }).$extends(withAccelerate())

    const body = await c.req.json()
    
    if (!body.email || !body.password || !body.name) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
        name: body.name,
      },
    })

    const token = await sign({ id: user.id}, "secret")
    return c.json({ token })
  } catch (error) {
    console.error('Signup error:', error);
    if (error instanceof SyntaxError) {
      return c.json({ error: 'Invalid JSON format' }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.post('/api/v1/signin', async (c) => {
  try {
    // Verify content type
    const contentType = c.req.header('Content-Type')
    if (!contentType || !contentType.includes('application/json')) {
      return c.json({ error: 'Content-Type must be application/json' }, 400)
    }

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: c.env.DATABASE_URL,
        },
      },
    }).$extends(withAccelerate())

    const body = await c.req.json()
    
    if (!body.email || !body.password) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const user = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    })

    if (!user) {
      return c.json({ error: 'Invalid email' }, 401)   
    }
    if (user.password !== body.password) {
      return c.json({ error: 'Invalid password' }, 401)
    }

    const token = await sign({ id: user.id }, 'secret')
    return c.json({ token })
  } catch (error) {
    console.error('Signin error:', error);
    if (error instanceof SyntaxError) {
      return c.json({ error: 'Invalid JSON format' }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Image upload endpoint - updated for Cloudinary
app.post('/api/v1/upload-image', authMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return c.json({ error: 'No image provided' }, 400);
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(image.type)) {
      return c.json({ error: 'Invalid image type. Only JPEG, PNG, GIF, and WebP are supported' }, 400);
    }
    
    // Check file size (limit to 5MB)
    if (image.size > 5 * 1024 * 1024) {
      return c.json({ error: 'Image too large. Maximum size is 5MB' }, 400);
    }
    
    // Convert file to base64 for Cloudinary upload
    const arrayBuffer = await image.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const dataURI = `data:${image.type};base64,${base64}`;
    
    // Prepare Cloudinary upload
    const userId = c.get('jwtPayload').id;
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'medium-blog';
    
    // Create signature
    const params = {
      timestamp: timestamp.toString(),
      folder,
      public_id: `user_${userId}_${timestamp}`,
    };
    
    const paramString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join('&');
    
    const toSign = paramString + c.env.CLOUDINARY_API_SECRET;
    const signature = await sha1(toSign);
    
    // Prepare upload form
    const uploadFormData = new FormData();
    uploadFormData.append('file', dataURI);
    uploadFormData.append('api_key', c.env.CLOUDINARY_API_KEY);
    uploadFormData.append('timestamp', timestamp.toString());
    uploadFormData.append('signature', signature);
    uploadFormData.append('folder', folder);
    uploadFormData.append('public_id', params.public_id);
    
    // Upload to Cloudinary
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${c.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: uploadFormData
      }
    );
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.error('Cloudinary error:', errorData);
      return c.json({ error: 'Failed to upload image to storage service' }, 500);
    }
    
    const result = await uploadResponse.json();
    
    return c.json({ 
      success: true, 
      imageUrl: result.secure_url 
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return c.json({ error: 'Error uploading image' }, 500);
  }
});

// Helper function to generate SHA1 hash
async function sha1(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Protected blog routes
app.post('/api/v1/blog', authMiddleware, async (c) => {
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url: c.env.DATABASE_URL } },
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const userId = c.get('jwtPayload').id;

    const post = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        published: body.published || false,
        authorId: userId,
        imageUrl: body.imageUrl || null, // Add support for image URL
      },
    });

    return c.json(post);
  } catch (error) {
    return c.json({ error: "Error creating post" }, 500);
  }
});

app.put('/api/v1/blog/:id', authMiddleware, async (c) => {
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url: c.env.DATABASE_URL } },
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const id = c.req.param('id');
    const userId = c.get('jwtPayload').id;

    const post = await prisma.post.update({
      where: { 
        id: id,
        authorId: userId // Ensure user owns the post
      },
      data: {
        title: body.title,
        content: body.content,
        published: body.published,
        imageUrl: body.imageUrl // Add support for updating image URL
      },
    });

    return c.json(post);
  } catch (error) {
    return c.json({ error: "Error updating post" }, 500);
  }
});

app.get('/api/v1/blog/:id', async (c) => {
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url: c.env.DATABASE_URL } },
    }).$extends(withAccelerate());

    const id = c.req.param('id');
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    return c.json(post);
  } catch (error) {
    return c.json({ error: "Error fetching post" }, 500);
  }
});

app.get('/api/v1/blogs', async (c) => {
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url: c.env.DATABASE_URL } },
    }).$extends(withAccelerate());

    const posts = await prisma.post.findMany({
      where: { published: true },
      include: {
        author: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    return c.json(posts);
  } catch (error) {
    return c.json({ error: "Error fetching posts" }, 500);
  }
});

// Get 3 recent stories
app.get('/api/v1/blogs/recent', async (c) => {
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url: c.env.DATABASE_URL } },
    }).$extends(withAccelerate());

    const recentPosts = await prisma.post.findMany({
      where: { published: true },
      include: {
        author: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      },
      take: 3
    });

    return c.json(recentPosts);
  } catch (error) {
    return c.json({ error: "Error fetching recent posts" }, 500);
  }
});

// Delete blog post
app.delete('/api/v1/blog/:id', authMiddleware, async (c) => {
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url: c.env.DATABASE_URL } },
    }).$extends(withAccelerate());

    const id = c.req.param('id');
    const userId = c.get('jwtPayload').id;

    // Check if post exists and belongs to user
    const post = await prisma.post.findFirst({
      where: {
        id: id,
        authorId: userId
      }
    });

    if (!post) {
      return c.json({ error: "Post not found or you don't have permission" }, 404);
    }

    // Delete associated comments first
    await prisma.comment.deleteMany({
      where: {
        postId: id
      }
    });

    // Delete the post
    await prisma.post.delete({
      where: {
        id: id
      }
    });

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Error deleting post" }, 500);
  }
});

// Add comment to blog
app.post('/api/v1/blog/:id/comment', authMiddleware, async (c) => {
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url: c.env.DATABASE_URL } },
    }).$extends(withAccelerate());

    const postId = c.req.param('id');
    const userId = c.get('jwtPayload').id;
    const body = await c.req.json();

    const comment = await prisma.comment.create({
      data: {
        content: body.content,
        postId: postId,
        authorId: userId
      }
    });

    return c.json(comment);
  } catch (error) {
    return c.json({ error: "Error adding comment" }, 500);
  }
});

// Get comments for a post
app.get('/api/v1/blog/:id/comments', async (c) => {
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url: c.env.DATABASE_URL } },
    }).$extends(withAccelerate());

    const postId = c.req.param('id');
    
    const comments = await prisma.comment.findMany({
      where: {
        postId: postId
      },
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    return c.json(comments);
  } catch (error) {
    return c.json({ error: "Error fetching comments" }, 500);
  }
});

// Like a post
app.post('/api/v1/blog/:id/like', authMiddleware, async (c) => {
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url: c.env.DATABASE_URL } },
    }).$extends(withAccelerate());

    const postId = c.req.param('id');
    const userId = c.get('jwtPayload').id;

    // Update the post to add the user to likes
    await prisma.post.update({
      where: {
        id: postId
      },
      data: {
        likes: {
          connect: {
            id: userId
          }
        }
      }
    });

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Error liking post" }, 500);
  }
});

// Unlike a post
app.post('/api/v1/blog/:id/unlike', authMiddleware, async (c) => {
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url: c.env.DATABASE_URL } },
    }).$extends(withAccelerate());

    const postId = c.req.param('id');
    const userId = c.get('jwtPayload').id;

    // Update the post to remove the user from likes
    await prisma.post.update({
      where: {
        id: postId
      },
      data: {
        likes: {
          disconnect: {
            id: userId
          }
        }
      }
    });

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Error unliking post" }, 500);
  }
});

// Get user profile
app.get('/api/v1/user/profile', authMiddleware, async (c) => {
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url: c.env.DATABASE_URL } },
    }).$extends(withAccelerate());

    const userId = c.get('jwtPayload').id;
    
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        email: true,
        name: true,
        posts: {
          select: {
            id: true,
            title: true,
            published: true
          }
        }
      }
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(user);
  } catch (error) {
    return c.json({ error: "Error fetching user profile" }, 500);
  }
});

export default app
