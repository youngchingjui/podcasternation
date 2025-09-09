# Welcome to your Convex + Next.js + Convex Auth app

This is a [Convex](https://convex.dev/) project created with [`npm create convex`](https://www.npmjs.com/package/create-convex).

After the initial setup (<2 minutes) you'll have a working full-stack app using:

- Convex as your backend (database, server logic)
- [React](https://react.dev/) as your frontend (web page interactivity)
- [Next.js](https://nextjs.org/) for optimized web hosting and page routing
- [Tailwind](https://tailwindcss.com/) for building great looking accessible UI
- [Convex Auth](https://labs.convex.dev/auth) for authentication

## Get started

If you just cloned this codebase and didn't use `npm create convex`, run:

```
pnpm install
pnpm run dev
```

If you're reading this README on GitHub and want to use this template, run:

```
npm create convex@latest -- -t nextjs-convexauth
```

## S3 image uploads (what you need to provide)

This repo now supports direct image uploads to Amazon S3 and displays the images on the homepage in the "Your uploads (S3)" section.

Provide these environment variables (e.g., in a `.env.local` file at the repo root).

Required:

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION (e.g., us-east-1)
- S3_BUCKET_NAME (name of your bucket)

Optional but recommended:

- S3_PUBLIC_BASE_URL: Base URL used to display the images. Examples:
  - Your CloudFront domain, e.g. `https://cdn.example.com`
  - Or the S3 regional domain, e.g. `https://my-bucket.s3.us-east-1.amazonaws.com`
- S3_UPLOAD_PREFIX: Key prefix for uploaded files. Default: `uploads/`

Bucket CORS configuration (so the browser can PUT directly to S3):

```
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.example"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"]
  }
]
```

Bucket access policy options to make images viewable:

- Simplest: Set `ACL: public-read` on upload (already done in the presign route) and allow public reads in your bucket policy.
- Preferred: Serve through CloudFront (set `S3_PUBLIC_BASE_URL` to your CloudFront distribution URL) and keep bucket private except for the distribution.

After setting the env vars, start the dev server and try uploading an image in the new section:

```
pnpm run dev
```

The code that powers this lives in:

- API routes: `app/api/s3/presign/route.ts` and `app/api/s3/list/route.ts`
- UI section: `app/page.tsx` (component `UploadsSection`)

## Learn more

To learn more about developing your project with Convex, check out:

- The [Tour of Convex](https://docs.convex.dev/get-started) for a thorough introduction to Convex principles.
- The rest of [Convex docs](https://docs.convex.dev/) to learn about all Convex features.
- [Stack](https://stack.convex.dev/) for in-depth articles on advanced topics.
- [Convex Auth docs](https://labs.convex.dev/auth) for documentation on the Convex Auth library.

## Configuring other authentication methods

To configure different authentication methods, see [Configuration](https://labs.convex.dev/auth/config) in the Convex Auth docs.

## Join the community

Join thousands of developers building full-stack apps with Convex:

- Join the [Convex Discord community](https://convex.dev/community) to get help in real-time.
- Follow [Convex on GitHub](https://github.com/get-convex/), star and contribute to the open-source implementation of Convex.
