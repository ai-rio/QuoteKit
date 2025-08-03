
# **A Pragmatic Guide to Integrating a Markdown Blog into a Next.js SaaS**

## **Executive Summary**

For a solo developer building a Software-as-a-Service (SaaS) application with Next.js, the most pragmatic, efficient, and maintainable strategy for integrating a blog is the **"Local MDX Content as Data"** pattern. This approach treats a directory of local .md or .mdx files within the project's Git repository as the single source of truth for all blog content. It leverages the native capabilities of Next.js for server-side rendering and static site generation (SSG) to deliver a high-performance, SEO-friendly blog with minimal architectural complexity.

The recommended technology stack for this pattern is:

* **Content Storage**: Local .mdx files organized in a dedicated project directory, such as /content/posts.  
* **Metadata Parsing**: The gray-matter library is the industry standard for extracting YAML frontmatter (e.g., title, date, author, slug) from each file.  
* **MDX Rendering**: The next-mdx-remote library provides the optimal balance of simplicity and power for rendering MDX content into React components, enabling the use of custom components within blog posts.

This strategy aligns perfectly with the stated priorities of simplicity and low maintenance. It introduces no new external services, databases, or APIs, thereby avoiding additional costs, accounts, and points of failure. The entire content workflow is managed through Git, a tool already central to the development process, and deployments are automated via Vercel, making the act of publishing a new post as simple as a git push.

## **The Recommended Pattern: Local MDX Content as Data**

### **Conceptual Framework: Your Filesystem is Your CMS**

The core philosophy of this pattern is to treat the local filesystem as a Content Management System (CMS). Instead of relying on an external database or a third-party API, a simple directory of Markdown files becomes the definitive source for all blog content.

* **Git as the "Admin Panel"**: Every action related to content—creating a new post, editing an existing one, or fixing a typo—is handled through a Git commit. This provides a robust, version-controlled, and auditable history of all content changes. For a developer, this workflow is not an added burden but a natural extension of existing practices.1  
* **Vercel as the "Publisher"**: When the project is hosted on Vercel, any git push to the main branch can automatically trigger a new build and deployment. This seamless integration means that publishing new content is an automated, hands-off process once the initial commit is made.  
* **Simplicity by Design**: This approach is consistently endorsed within the developer community as the most straightforward method for personal blogs or SaaS blogs managed directly by the founding developer, as it eliminates entire categories of complexity associated with external systems.1

### **Anatomy of the Solution: The Three Pillars**

The implementation of this pattern rests on three foundational pillars: a conventional file structure, a minimal set of essential libraries, and the core data-fetching logic of Next.js.

#### **Pillar 1: File Structure and Content Format**

A standardized structure is key to a manageable local content system.

* **Content Directory**: All blog posts, as .mdx files, are stored in a dedicated directory at the root of the project. Common conventions include naming this directory /posts, /content, or /data.1  
* **File Naming**: Each .mdx file represents a single blog post. The filename typically serves as the URL slug for the post. For example, a file named how-to-integrate-a-blog.mdx will correspond to the URL /blog/how-to-integrate-a-blog.  
* **Frontmatter**: Every .mdx file begins with a block of YAML frontmatter, enclosed by triple dashes (---). This section contains structured metadata about the post, such as title, date, author, excerpt, and any custom fields required. The body of the post, written in Markdown and JSX, follows this block.1

## **An example post file (/content/posts/my-first-post.mdx):**

## **title: 'My First Blog Post' date: '2024-08-15' excerpt: 'This is a short summary of my very first post, which will appear on the blog index page.' author: 'Solo Founder'**

# **Welcome to My Blog**

This is the main content of the post. Because this is an .mdx file, I can embed React components directly.

#### **Pillar 2: Essential Libraries**

Only two core libraries are required to power this entire system.

* **gray-matter**: This is the de facto standard library for parsing files with frontmatter. It takes the raw content of a file, intelligently separates the YAML block from the main content, and returns a clean JavaScript object. The output includes a data object containing the parsed frontmatter and a content string with the rest of the file.1  
* **next-mdx-remote**: This library is responsible for taking the raw MDX content string from gray-matter and securely rendering it into React components. Its key advantage is that it decouples the content from the presentation; .mdx files do not need to contain import statements for the custom components they use. Instead, these components are passed to the renderer at the page level, keeping the content files clean and portable.9  
* **Optional remark and rehype plugins**: For more advanced features, the remark (for Markdown processing) and rehype (for HTML processing) ecosystems can be tapped. Common use cases include syntax highlighting for code blocks with rehype-pretty-code or automatically generating anchor links for headings with rehype-slug.1

#### **Pillar 3: Next.js Core Logic (Static Site Generation)**

Next.js provides the functions needed to read the local files at build time and generate static HTML pages. The implementation differs slightly between the older Pages Router and the modern App Router.

* **For the Pages Router (Legacy)**:  
  * **getStaticPaths**: This function is used in a dynamic route file (e.g., pages/blog/\[slug\].js). At build time, it reads the /posts directory, creates a list of all post slugs from the filenames, and informs Next.js of all the static pages that need to be generated (e.g., /blog/post-1, /blog/post-2).5  
  * **getStaticProps**: For each slug identified by getStaticPaths, this function is called. It reads the content of the corresponding .mdx file, uses gray-matter to parse it, and then passes the frontmatter metadata and the raw MDX content string as props to the page component for rendering.15  
* **For the App Router (Recommended)**:  
  * **generateStaticParams**: This is the App Router's equivalent of getStaticPaths. It is used in a dynamic segment file (e.g., app/blog/\[slug\]/page.tsx) to read the content directory and return an array of all possible slug parameters, signaling Next.js to generate these pages statically.18  
  * **async React Server Components (RSCs)**: The page component itself becomes an async function. This allows it to directly perform server-side operations, such as reading files from the filesystem using Node.js APIs (fs, path). The logic for fetching and parsing a specific post's content is co-located within the page component, simplifying the data flow.19

### **Step-by-Step Implementation Guide (App Router)**

This guide outlines the process for integrating a blog using the modern App Router.

**Step 1: Install Dependencies**

Bash

npm install gray-matter next-mdx-remote

Step 2: Create Content Directory and Sample Post  
Create a directory content/posts at the root of your project. Inside, add a file named hello-world.mdx with some frontmatter and content.  
Step 3: Create the Blog Index Page (app/blog/page.tsx)  
This page will list all available blog posts. It's good practice to create a utility function to handle file system logic.

TypeScript

// lib/posts.ts  
import fs from 'fs';  
import path from 'path';  
import matter from 'gray-matter';

const postsDirectory \= path.join(process.cwd(), 'content/posts');

export function getSortedPostsData() {  
  const fileNames \= fs.readdirSync(postsDirectory);  
  const allPostsData \= fileNames.map((fileName) \=\> {  
    const slug \= fileName.replace(/\\.mdx$/, '');  
    const fullPath \= path.join(postsDirectory, fileName);  
    const fileContents \= fs.readFileSync(fullPath, 'utf8');  
    const matterResult \= matter(fileContents);

    return {  
      slug,  
     ...(matterResult.data as { title: string; date: string; excerpt: string }),  
    };  
  });

  return allPostsData.sort((a, b) \=\> (a.date \< b.date? 1 : \-1));  
}

// app/blog/page.tsx  
import Link from 'next/link';  
import { getSortedPostsData } from '@/lib/posts';

export default function BlogIndex() {  
  const allPosts \= getSortedPostsData();

  return (  
    \<section\>  
      \<h1\>Blog\</h1\>  
      \<ul\>  
        {allPosts.map(({ slug, title, date, excerpt }) \=\> (  
          \<li key\={slug}\>  
            \<h2\>  
              \<Link href\={\`/blog/${slug}\`}\>{title}\</Link\>  
            \</h2\>  
            \<small\>{date}\</small\>  
            \<p\>{excerpt}\</p\>  
          \</li\>  
        ))}  
      \</ul\>  
    \</section\>  
  );  
}

Step 4: Create the Dynamic Post Page (app/blog/\[slug\]/page.tsx)  
This page will render individual blog posts.

TypeScript

// app/blog/\[slug\]/page.tsx  
import fs from 'fs';  
import path from 'path';  
import matter from 'gray-matter';  
import { MDXRemote } from 'next-mdx-remote/rsc';

const postsDirectory \= path.join(process.cwd(), 'content/posts');

// This function generates the static paths for all posts  
export async function generateStaticParams() {  
  const fileNames \= fs.readdirSync(postsDirectory);  
  return fileNames.map((fileName) \=\> ({  
    slug: fileName.replace(/\\.mdx$/, ''),  
  }));  
}

// This function gets the content for a single post  
function getPostData(slug: string) {  
  const fullPath \= path.join(postsDirectory, \`${slug}.mdx\`);  
  const fileContents \= fs.readFileSync(fullPath, 'utf8');  
  const { data, content } \= matter(fileContents);  
  return { data, content };  
}

export default function PostPage({ params }: { params: { slug: string } }) {  
  const { data, content } \= getPostData(params.slug);

  return (  
    \<article\>  
      \<h1\>{data.title}\</h1\>  
      \<div\>{data.date}\</div\>  
      \<MDXRemote source\={content} /\>  
    \</article\>  
  );  
}

Step 5: Configure Custom Components (mdx-components.tsx)  
To use custom React components in your MDX files or to style default HTML elements, create an mdx-components.tsx file at the root of your project or inside the /app directory.

TypeScript

// mdx-components.tsx  
import type { MDXComponents } from 'mdx/types';

// Example custom component  
const Callout \= ({ children }: { children: React.ReactNode }) \=\> (  
  \<div style\={{ border: '1px solid blue', padding: '1rem' }}\>{children}\</div\>  
);

export function useMDXComponents(components: MDXComponents): MDXComponents {  
  return {  
    // Override default HTML elements  
    h2: ({ children }) \=\> \<h2 style\={{ color: 'blue' }}\>{children}\</h2\>,  
    // Make custom components available without importing them in MDX  
    Callout,  
   ...components,  
  };  
}

Next.js will automatically pick up this file and apply the components to all rendered MDX content.21

## **Evidence and Community Consensus**

### **Synthesis of Developer Sentiment from Reddit**

Analysis of discussions on forums like r/nextjs reveals a strong and consistent consensus regarding blog implementation. The recommended approach is highly dependent on who the content author is.

* **The Overwhelming Consensus for Simplicity**: For a solo developer, a technical founder, or anyone comfortable with Markdown and Git, the local file-based approach is consistently championed as the simplest and most direct solution.1 Community members frequently use phrases like "Markdown with MDX is the way to go" 1, "Keep it simple" 8, and praise the pattern for its "less complexity, faster dev, and easy maintenance".8 This sentiment directly reflects the priorities of a solo founder focused on shipping a product.  
* **The Primary "Gotcha"**: The most commonly cited trade-off of this approach is the necessity of a full application redeployment to fix a minor typo or update a post.8 While acknowledged, this is generally framed as an acceptable price for the immense gains in simplicity, cost-effectiveness, and the elimination of external dependencies. For a typical SaaS blog with a publishing cadence of once or twice a week, this is a minor operational detail, not a significant roadblock.  
* **Clear Delineation for Headless CMS**: The community has a clear mental model for when to introduce more complexity. A Headless CMS (such as Sanity, Contentful, or Payload) is almost exclusively recommended when the primary content creators are non-technical team members (e.g., a marketing department) who require a user-friendly graphical interface.1 For a solo developer, introducing a Headless CMS is often described as "unnecessary overhead".8

### **Analysis of Exemplary GitHub Projects**

Popular open-source starter templates provide production-grade validation for the "Local MDX Content as Data" pattern.

* **Case Study 1: timlrx/tailwind-nextjs-starter-blog**: This is one of the most starred and feature-rich Next.js blog starters available.25 Its architecture is a testament to the power and scalability of the local file pattern. It uses a  
  data/blog directory to store .mdx files and relies on reading the filesystem at build time to generate all pages statically. It serves as a perfect example of how to build upon the basic pattern to add advanced features like tags, RSS feeds, and sitemaps, demonstrating its extensibility.  
* **Case Study 2: johnpolacek/nextjs-mdx-blog-starter**: This project offers a simpler, more direct implementation that is excellent for learning the core concepts.6 Its  
  README.md explicitly guides the user to add new metadata fields to the frontmatter of their .mdx files and then update the getStaticProps function to process that new data.6 This instruction perfectly encapsulates the developer-centric workflow at the heart of the recommended pattern.

## **Deep Dive: The Tooling Decision Matrix**

### **Frontmatter Parsing: Why gray-matter is the Only Choice**

For parsing frontmatter, gray-matter is the undisputed and correct choice.

* **Market Dominance**: It is the default parser used by major static site generators like Eleventy and is the most frequently recommended library in all relevant community discussions.1 Its vast number of dependents on npm underscores its status as a foundational utility in the JavaScript ecosystem.7  
* **Focused Functionality**: The library adheres to the Unix philosophy of doing one thing and doing it well. It reliably takes a string, separates the frontmatter from the content, and returns a predictable object. It is fast, accurate, and requires no complex configuration.7 There is no practical reason to consider alternatives for this task.

### **MDX Rendering: @next/mdx vs. next-mdx-remote**

The choice of how to render MDX content has more nuance. The two primary options, @next/mdx and next-mdx-remote, represent different architectural philosophies.

| Feature | @next/mdx | next-mdx-remote |
| :---- | :---- | :---- |
| **Primary Role** | Treats .mdx files as pages. | Treats .mdx files as data to be rendered by pages. |
| **Setup Complexity** | Simpler; configured mainly in next.config.js. | Slightly more involved; requires serialize and \<MDXRemote\> component. |
| **Content Portability** | Lower. Content is tied to the Next.js page structure. | Higher. Content is pure MDX, easily moved to any other system. |
| **import in MDX** | Required for layouts and custom components, mixing logic and content. | Not needed. Components are injected at render time, keeping content clean. |
| **Flexibility** | Less flexible. Content must live in the app or pages directory. | Highly flexible. Content can be sourced from anywhere (local files, DB, API). |

While @next/mdx might seem simpler at first glance, **next-mdx-remote is the superior choice for a scalable and maintainable blog**. The clean separation of content from presentation logic is a fundamental software design principle that pays dividends in the long run.11 It ensures that the blog posts remain portable and can be migrated to a different system in the future with minimal effort.9

### **A Note on Contentlayer: The Ghost of Simplicity Past**

In many discussions from 2023 and earlier, Contentlayer is frequently recommended as the best way to work with local Markdown.1 It was a "content SDK" that provided a type-safe, elegant API over local files, abstracting away the manual file-reading and parsing logic.31 However,

**the Contentlayer project is no longer actively maintained**.30

Relying on an unmaintained library for a core function of a production SaaS introduces significant risk. Future updates to Next.js could break compatibility, leaving the project without official support. The abandonment of Contentlayer serves as a powerful lesson in dependency management. It validates the strategy of building upon stable, foundational libraries like gray-matter, remark, and rehype. The small, one-time effort of writing the file-system logic manually is a worthwhile investment that purchases long-term stability and control—precisely what a solo founder requires. Therefore, Contentlayer and its community forks should be avoided for new projects.

## **Complexity Trade-offs: Why This is the Simplest Path**

### **Local MDX vs. Headless CMS**

The "Local MDX Content as Data" pattern is fundamentally simpler than integrating a Headless CMS across several key dimensions.

| Factor | Local MDX Pattern | Headless CMS |
| :---- | :---- | :---- |
| **Initial Setup Time** | Low (minutes to install packages and write utility functions). | Medium (hours to set up account, model content, configure API keys). |
| **Maintenance Burden** | Minimal (update npm packages). | Higher (manage an external service, handle API changes, monitor uptime). |
| **Monthly Cost** | $0. | Free tier, but can incur costs with scale or advanced features. |
| **Content Workflow** | Unified with code (VS Code \+ Git). | Separate, web-based UI. |
| **\# of Dependencies** | 0 external services. | 1+ external service. |
| **Data Portability** | Excellent (plain text files). | Good, but requires API-based export/migration. |

For a solo developer, the local pattern avoids the cognitive overhead of learning a new system, managing API keys, and modeling content in a separate UI.8

### **Local MDX vs. Git-based CMS**

Tools like Decap CMS (formerly Netlify CMS) or TinaCMS offer a graphical user interface on top of a Git repository.37 While they bridge the gap between a Headless CMS and local files, they represent an unnecessary layer of abstraction for a developer who is also the primary author. The benefit of these tools is providing a friendly UI for non-technical users; since the developer can edit the

.mdx files directly in their code editor, adding another interface offers no advantage and only increases the project's complexity.

## **Conclusion and Forward-Looking Advice**

For a solo founder building a SaaS with Next.js, the **"Local MDX Content as Data"** pattern, powered by gray-matter for parsing and next-mdx-remote for rendering, is the unequivocal recommendation. It is the simplest, most cost-effective, and most "native" solution that aligns perfectly with a developer-centric workflow. It minimizes complexity and dependencies, allowing focus to remain on building the core product and writing valuable content.

This approach is not a short-term hack but a robust, scalable, and future-proof foundation.

* **Scalability**: The pattern scales exceptionally well. As the number of posts grows, Next.js's Static Site Generation, combined with Vercel's optimized build infrastructure, ensures that performance remains high.  
* **Future-Proof Migration Path**: The most significant advantage of this pattern is that it is a "no-regrets" decision. By keeping the .mdx content files clean and free of presentational logic, they remain completely portable. If the SaaS grows to a point where a dedicated content team and a Headless CMS are required, the migration path is straightforward. A one-time script can be written to parse the local files and import them into a new system like Sanity or Contentful. The rendering logic in the Next.js application, already built around next-mdx-remote, would require minimal changes to fetch from a new API endpoint instead of the local filesystem. This ensures that the work done today builds a valuable, portable content asset for the future.

#### **Referências citadas**

1. NextJS Blogs \- Best way to do it? : r/nextjs \- Reddit, acessado em julho 23, 2025, [https://www.reddit.com/r/nextjs/comments/1l9wpv2/nextjs\_blogs\_best\_way\_to\_do\_it/](https://www.reddit.com/r/nextjs/comments/1l9wpv2/nextjs_blogs_best_way_to_do_it/)  
2. Blog app in nextjs \- Reddit, acessado em julho 23, 2025, [https://www.reddit.com/r/nextjs/comments/1hw1jci/blog\_app\_in\_nextjs/](https://www.reddit.com/r/nextjs/comments/1hw1jci/blog_app_in_nextjs/)  
3. The best way to blog : r/nextjs \- Reddit, acessado em julho 23, 2025, [https://www.reddit.com/r/nextjs/comments/1h8sld6/the\_best\_way\_to\_blog/](https://www.reddit.com/r/nextjs/comments/1h8sld6/the_best_way_to_blog/)  
4. Best way to add blog to a next.js website without CMS? : r/nextjs \- Reddit, acessado em julho 23, 2025, [https://www.reddit.com/r/nextjs/comments/1eg1rt9/best\_way\_to\_add\_blog\_to\_a\_nextjs\_website\_without/](https://www.reddit.com/r/nextjs/comments/1eg1rt9/best_way_to_add_blog_to_a_nextjs_website_without/)  
5. Setting up a NextJS Markdown Blog with Typescript \- Bionic Julia, acessado em julho 23, 2025, [https://bionicjulia.com/blog/setting-up-nextjs-markdown-blog-with-typescript](https://bionicjulia.com/blog/setting-up-nextjs-markdown-blog-with-typescript)  
6. johnpolacek/nextjs-mdx-blog-starter: Next.js MDX Blog ... \- GitHub, acessado em julho 23, 2025, [https://github.com/johnpolacek/nextjs-mdx-blog-starter](https://github.com/johnpolacek/nextjs-mdx-blog-starter)  
7. gray-matter \- npm, acessado em julho 23, 2025, [https://www.npmjs.com/package/gray-matter](https://www.npmjs.com/package/gray-matter)  
8. Seeking suggestion: What is the best way to add a blog to a Next app? : r/reactjs \- Reddit, acessado em julho 23, 2025, [https://www.reddit.com/r/reactjs/comments/1ccxbgs/seeking\_suggestion\_what\_is\_the\_best\_way\_to\_add\_a/](https://www.reddit.com/r/reactjs/comments/1ccxbgs/seeking_suggestion_what_is_the_best_way_to_add_a/)  
9. Comprehensive Guide to Using next-mdx-remote in Next.js \- DhiWise, acessado em julho 23, 2025, [https://www.dhiwise.com/post/comprehensive-guide-to-using-next-mdx-remote-in-nextjs](https://www.dhiwise.com/post/comprehensive-guide-to-using-next-mdx-remote-in-nextjs)  
10. hashicorp/next-mdx-remote: Load MDX content from anywhere \- GitHub, acessado em julho 23, 2025, [https://github.com/hashicorp/next-mdx-remote](https://github.com/hashicorp/next-mdx-remote)  
11. @next/mdx VS. next-mdx-remote \- Chen Yang, acessado em julho 23, 2025, [https://www.cyishere.dev/blog/next-mdx-or-next-mdx-remote](https://www.cyishere.dev/blog/next-mdx-or-next-mdx-remote)  
12. How to Build a Static MDX Blog with Next.js and Contentlayer, acessado em julho 23, 2025, [https://www.kozhuhds.com/blog/how-to-build-a-static-mdx-blog-with-nextjs-and-contentlayer/](https://www.kozhuhds.com/blog/how-to-build-a-static-mdx-blog-with-nextjs-and-contentlayer/)  
13. Creating a Markdown Blog with Next.js \- TinaCMS, acessado em julho 23, 2025, [https://pre-beta.tina.io/blog/simple-markdown-blog-nextjs/](https://pre-beta.tina.io/blog/simple-markdown-blog-nextjs/)  
14. Functions: getStaticPaths | Next.js, acessado em julho 23, 2025, [https://nextjs.org/docs/pages/api-reference/functions/get-static-paths](https://nextjs.org/docs/pages/api-reference/functions/get-static-paths)  
15. Just Files | Build a Blog with Next.js and React Markdown \- Medium, acessado em julho 23, 2025, [https://medium.com/the-tech-pulse/just-files-build-a-blog-with-next-js-and-react-markdown-305935c86aca](https://medium.com/the-tech-pulse/just-files-build-a-blog-with-next-js-and-react-markdown-305935c86aca)  
16. Functions: getStaticProps \- Next.js, acessado em julho 23, 2025, [https://nextjs.org/docs/pages/api-reference/functions/get-static-props](https://nextjs.org/docs/pages/api-reference/functions/get-static-props)  
17. Data Fetching: getStaticProps \- Next.js, acessado em julho 23, 2025, [https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props)  
18. Error with getStaticPaths() and getStaticProps() with nested routes in NextJS 14, acessado em julho 23, 2025, [https://stackoverflow.com/questions/77782944/error-with-getstaticpaths-and-getstaticprops-with-nested-routes-in-nextjs-14](https://stackoverflow.com/questions/77782944/error-with-getstaticpaths-and-getstaticprops-with-nested-routes-in-nextjs-14)  
19. Creating a Next.js Blog with App Router and Markdown (2024 Update), acessado em julho 23, 2025, [https://developdbycherron.com/blog/nextjs-markdown-blog](https://developdbycherron.com/blog/nextjs-markdown-blog)  
20. Building a blog with Next.js 15 and React Server Components \- Max Leiter, acessado em julho 23, 2025, [https://maxleiter.com/blog/build-a-blog-with-nextjs-13](https://maxleiter.com/blog/build-a-blog-with-nextjs-13)  
21. rodrigo-miranda18/nextjs-mdx-intl-blog-starter: This is a internationalized blog template built with Next.js 15, featuring full i18n support, and all post content managed through MDX files. Perfect for developers wanting to create multilingual blogs with minimal setup. Performance-optimized, SEO-friendly, \- GitHub, acessado em julho 23, 2025, [https://github.com/rodrigo-miranda18/nextjs-mdx-intl-blog-starter](https://github.com/rodrigo-miranda18/nextjs-mdx-intl-blog-starter)  
22. Guides: MDX \- Next.js, acessado em julho 23, 2025, [https://nextjs.org/docs/app/guides/mdx](https://nextjs.org/docs/app/guides/mdx)  
23. Creating a Next.js blog for a friend, how can they easily create/edit posts : r/nextjs \- Reddit, acessado em julho 23, 2025, [https://www.reddit.com/r/nextjs/comments/1169chw/creating\_a\_nextjs\_blog\_for\_a\_friend\_how\_can\_they/](https://www.reddit.com/r/nextjs/comments/1169chw/creating_a_nextjs_blog_for_a_friend_how_can_they/)  
24. User-Friendly Blogging System/Platform for Next.js : r/nextjs \- Reddit, acessado em julho 23, 2025, [https://www.reddit.com/r/nextjs/comments/1fz6qqm/userfriendly\_blogging\_systemplatform\_for\_nextjs/](https://www.reddit.com/r/nextjs/comments/1fz6qqm/userfriendly_blogging_systemplatform_for_nextjs/)  
25. timlrx/tailwind-nextjs-starter-blog: This is a Next.js, Tailwind ... \- GitHub, acessado em julho 23, 2025, [https://github.com/timlrx/tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog)  
26. Next.js Tailwind Starter Blog \- Jamstack Themes, acessado em julho 23, 2025, [https://jamstackthemes.dev/theme/nextjs-tailwind-starter-blog/](https://jamstackthemes.dev/theme/nextjs-tailwind-starter-blog/)  
27. Custom Front Matter — Eleventy, acessado em julho 23, 2025, [https://www.11ty.dev/docs/data-frontmatter-customize/](https://www.11ty.dev/docs/data-frontmatter-customize/)  
28. node\_modules/gray-matter · master · tbrousso / imt\_maquette\_reunionv4 · GitLab \- PLMlab, acessado em julho 23, 2025, [https://plmlab.math.cnrs.fr/tbrousso/imt\_maquette\_reunionv4/-/tree/master/node\_modules/gray-matter](https://plmlab.math.cnrs.fr/tbrousso/imt_maquette_reunionv4/-/tree/master/node_modules/gray-matter)  
29. What's the easiest way for me a to add a static blog to my existing ..., acessado em julho 23, 2025, [https://www.reddit.com/r/nextjs/comments/13d3j0q/whats\_the\_easiest\_way\_for\_me\_a\_to\_add\_a\_static/](https://www.reddit.com/r/nextjs/comments/13d3j0q/whats_the_easiest_way_for_me_a_to_add_a_static/)  
30. Building a huge blog with Next.js (preferably MD / MDX) : r/nextjs \- Reddit, acessado em julho 23, 2025, [https://www.reddit.com/r/nextjs/comments/1i6gxd1/building\_a\_huge\_blog\_with\_nextjs\_preferably\_md\_mdx/](https://www.reddit.com/r/nextjs/comments/1i6gxd1/building_a_huge_blog_with_nextjs_preferably_md_mdx/)  
31. Getting Started \- Contentlayer, acessado em julho 23, 2025, [https://contentlayer.dev/docs/getting-started-cddd76b7](https://contentlayer.dev/docs/getting-started-cddd76b7)  
32. How to create a Blog with Contentlayer and NextJs | Sandro Maglione, acessado em julho 23, 2025, [https://www.sandromaglione.com/articles/contentlayer-blog-template-with-nextjs](https://www.sandromaglione.com/articles/contentlayer-blog-template-with-nextjs)  
33. Build SEO Optimized Blog with Next.js, Contentlayer, and Tailwind CSS \- YouTube, acessado em julho 23, 2025, [https://www.youtube.com/watch?v=1QGLHOaRLwM](https://www.youtube.com/watch?v=1QGLHOaRLwM)  
34. Any best markdown blog module somewhere in Next.js? : r/nextjs \- Reddit, acessado em julho 23, 2025, [https://www.reddit.com/r/nextjs/comments/1em9aho/any\_best\_markdown\_blog\_module\_somewhere\_in\_nextjs/](https://www.reddit.com/r/nextjs/comments/1em9aho/any_best_markdown_blog_module_somewhere_in_nextjs/)  
35. Why not skip headless CMS and just build your own backend for blogs? \- Reddit, acessado em julho 23, 2025, [https://www.reddit.com/r/nextjs/comments/1kmaooh/why\_not\_skip\_headless\_cms\_and\_just\_build\_your\_own/](https://www.reddit.com/r/nextjs/comments/1kmaooh/why_not_skip_headless_cms_and_just_build_your_own/)  
36. Blog posts: how do you manage them? : r/nextjs \- Reddit, acessado em julho 23, 2025, [https://www.reddit.com/r/nextjs/comments/1cqesjj/blog\_posts\_how\_do\_you\_manage\_them/](https://www.reddit.com/r/nextjs/comments/1cqesjj/blog_posts_how_do_you_manage_them/)  
37. Building a Markdown Blog in Next.js with Decap CMS: A Comprehensive Guide, acessado em julho 23, 2025, [https://dev.to/aomuiz/building-a-markdown-blog-in-nextjs-with-decap-cms-a-comprehensive-guide-4j8p](https://dev.to/aomuiz/building-a-markdown-blog-in-nextjs-with-decap-cms-a-comprehensive-guide-4j8p)  
38. Drop-in Awesome List : r/SaaS \- Reddit, acessado em julho 23, 2025, [https://www.reddit.com/r/SaaS/comments/1jgoy18/dropin\_awesome\_list/](https://www.reddit.com/r/SaaS/comments/1jgoy18/dropin_awesome_list/)