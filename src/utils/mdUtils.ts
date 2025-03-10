import fs from 'fs';
import path from 'path';

// Function to read the markdown file for a blog post
export async function getBlogPostBySlug(slug: string) {
  const filePath = path.join(process.cwd(), 'src/content/blog', `${slug}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');

  // Return the content
  return {
    slug,
    content: fileContents,
  };
}

// Function to get all blog posts metadata (for the listing page)
export async function getAllBlogPosts() {
  const postsDirectory = path.join(process.cwd(), 'src/content/blog');
  const fileNames = fs.readdirSync(postsDirectory);

  const allPostsData = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
      // Remove ".md" from file name to get the slug
      const slug = fileName.replace(/\.md$/, '');

      // Read file content
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      // Extract title from first line (assuming it starts with # )
      const title = fileContents.split('\n')[0].replace(/^# /, '');

      // Extract excerpt (first paragraph after title)
      const excerpt = fileContents
        .split('\n\n')
        .filter(para => para && !para.startsWith('# '))[0]
        .trim();

      // Return post data
      return {
        slug,
        title,
        excerpt,
        // You can add more metadata like date if you include it in your markdown files
        date: 'June 10, 2024', // Hardcoded for now
        readTime: `${Math.ceil(fileContents.length / 1500)} min read`,
        category: 'Travel & Food' // Hardcoded for now
      };
    });

  // Sort posts by date (newest first)
  return allPostsData;
}