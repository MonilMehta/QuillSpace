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
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', '*'],
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

// Image upload endpoint - fixed to prevent stack overflow
app.post('/api/v1/upload-image', authMiddleware, async (c) => {
  try {
    const cloudName = c.env?.CLOUDINARY_CLOUD_NAME;
    const apiKey = c.env?.CLOUDINARY_API_KEY;
    const apiSecret = c.env?.CLOUDINARY_API_SECRET;
    
    if (!cloudName || !apiKey || !apiSecret) {
      return c.json({ error: 'Cloudinary configuration is incomplete' }, 500);
    }
    
    const formData = await c.req.formData();
    const imageFile = formData.get('image');
    
    if (!imageFile || !(imageFile instanceof File)) {
      return c.json({ error: 'No image provided or invalid image format' }, 400);
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(imageFile.type)) {
      return c.json({ error: 'Invalid image type. Only JPEG, PNG, GIF, and WebP are supported' }, 400);
    }
    
    // Check file size (limit to 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return c.json({ error: 'Image too large. Maximum size is 5MB' }, 400);
    }
    
    // Convert file to binary data
    const arrayBuffer = await imageFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64 safely without recursion
    let binary = '';
    const bytes = uint8Array;
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binary);
    
    // Create data URI
    const dataURI = `data:${imageFile.type};base64,${base64Data}`;
    
    // Prepare Cloudinary upload
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'medium-blog';
    
    // Create signature string - alphabetically ordered parameters
    const paramsToSign = {
      folder,
      timestamp: timestamp.toString()
    };
    
    // Build the string to sign
    const entries = Object.entries(paramsToSign).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
    const stringToSign = entries.map(([key, value]) => `${key}=${value}`).join('&') + apiSecret;
    
    // Generate signature
    const signature = await generateSHA1(stringToSign);
    
    // Create upload form data
    const uploadData = new FormData();
    uploadData.append('file', dataURI);
    uploadData.append('api_key', apiKey);
    uploadData.append('timestamp', timestamp.toString());
    uploadData.append('folder', folder);
    uploadData.append('signature', signature);
    
    // Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: uploadData
    });
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      console.error('Cloudinary upload failed:', errorData);
      return c.json({ error: 'Failed to upload image to Cloudinary', details: errorData }, 500);
    }
    
    const responseData = await uploadResponse.json();
    return c.json({ 
      success: true, 
      imageUrl: responseData.secure_url 
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return c.json({ 
      error: 'Error uploading image', 
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Improved SHA1 hash generation function
async function generateSHA1(message) {
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

// Update user profile
app.put('/api/v1/user/update', authMiddleware, async (c) => {
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url: c.env.DATABASE_URL } },
    }).$extends(withAccelerate());

    const userId = c.get('jwtPayload').id;
    const body = await c.req.json();
    
    // Validate the input
    if (!body.name || !body.email) {
      return c.json({ error: "Name and email are required" }, 400);
    }
    
    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: body.email,
        NOT: { id: userId }
      }
    });
    
    if (existingUser) {
      return c.json({ error: "Email is already taken" }, 400);
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: body.name,
        email: body.email
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    return c.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return c.json({ error: "Error updating profile" }, 500);
  }
});

// Change password
app.put('/api/v1/user/change-password', authMiddleware, async (c) => {
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url: c.env.DATABASE_URL } },
    }).$extends(withAccelerate());

    const userId = c.get('jwtPayload').id;
    const body = await c.req.json();
    
    // Validate the input
    if (!body.currentPassword || !body.newPassword) {
      return c.json({ error: "Current password and new password are required" }, 400);
    }
    
    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    
    // Check if current password is correct
    if (user.password !== body.currentPassword) {
      return c.json({ error: "Current password is incorrect" }, 400);
    }
    
    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: body.newPassword
      }
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ error: "Error changing password" }, 500);
  }
});

// Add a test endpoint to verify environment variables
app.get('/api/v1/test-env', async (c) => {
  try {
    return c.json({
      cloudinaryCloudName: c.env?.CLOUDINARY_CLOUD_NAME ? 'Available' : 'Missing',
      cloudinaryApiKey: c.env?.CLOUDINARY_API_KEY ? 'Available' : 'Missing',
      cloudinaryApiSecret: c.env?.CLOUDINARY_API_SECRET ? 'Available' : 'Missing',
      databaseUrl: c.env?.DATABASE_URL ? 'Available' : 'Missing'
    });
  } catch (error) {
    console.error('Error accessing environment variables:', error);
    return c.json({ error: 'Error accessing environment variables' }, 500);
  }
});

export default app;
