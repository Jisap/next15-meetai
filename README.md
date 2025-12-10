# Next15 MeetAI

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install dependencies:

```bash
npm install --legacy-peer-deps
```

> **Important**: Always use `--legacy-peer-deps` flag when installing packages due to React 19 compatibility requirements.

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## ⚠️ IMPORTANT: Polar Integration Status

> **🔴 CRITICAL NOTICE**: The Polar payment integration is currently **DISABLED** due to a compatibility issue discovered during the security update process.

### What This Means

**Currently NOT Working:**
- ❌ Automatic Polar customer creation on user signup
- ❌ Polar checkout integration
- ❌ Subscription management via Polar
- ❌ Payment processing through Polar

**Currently Working:**
- ✅ User authentication (email/password)
- ✅ OAuth login (Google, GitHub)
- ✅ User registration and management
- ✅ All other application features

### Technical Details

The `polarClient` plugin from `@polar-sh/better-auth` attempts to use Node.js-specific functions (`createRequire` from `node:module`) in the browser environment, causing a runtime error:

```
Error: createRequire is not a function
```

**Affected File**: `src/lib/auth-client.ts`

```typescript
// CURRENTLY DISABLED
export const authClient = createAuthClient({
  // TODO: Re-enable Polar plugin once compatibility issue is resolved
  // plugins: [polarClient()]
})
```

### Resolution Options

**Option 1: Wait for Official Fix** (Recommended)
- Monitor [@polar-sh/better-auth releases](https://github.com/polarsource/polar/releases)
- The issue has been reported to the Polar team
- Expected resolution in a future version

**Option 2: Manual Server-Side Integration**
- Implement Polar webhooks manually
- Create server actions for customer/subscription management
- Bypass the client-side plugin entirely

**Option 3: Downgrade to Earlier Version**
- Test `@polar-sh/better-auth` versions < 1.0.0
- May require additional dependency downgrades
- Not recommended due to potential security issues

### How to Re-enable (When Fixed)

Once a compatible version is released:

1. Update the package:
   ```bash
   npm install @polar-sh/better-auth@latest --legacy-peer-deps
   ```

2. Uncomment the plugin in `src/lib/auth-client.ts`:
   ```typescript
   import { polarClient } from "@polar-sh/better-auth"
   
   export const authClient = createAuthClient({
     plugins: [polarClient()]
   })
   ```

3. Test thoroughly before deploying to production

### Alternative Payment Solutions

While Polar integration is disabled, consider these alternatives:
- **Stripe**: Direct integration with Next.js
- **Paddle**: Merchant of record solution
- **LemonSqueezy**: Simple subscription management
- **Manual Polar API**: Server-side integration without the plugin

---


## Security Updates & Configuration

### Recent Security Patch (2025-12-10)

This project has been updated to address critical security vulnerabilities. Below are the key changes and configurations applied:

#### Vulnerability Status

- ✅ **CVE-2025-66478 (react2shell)**: Not affected
- ✅ **Resolved**: 14 vulnerabilities fixed
- ⚠️ **Remaining**: 5 moderate severity vulnerabilities (in `esbuild` and `next.js`)

#### Dependency Adjustments

The following packages were adjusted to resolve peer dependency conflicts:

```json
{
  "@polar-sh/better-auth": "^1.6.0",
  "@polar-sh/sdk": "^0.41.5",
  "@stream-io/openai-realtime-api": "^0.1.3",
  "better-auth": "^1.0.14",
  "date-fns": "^3.6.0",
  "zod": "^3.25.7"
}
```

**Key decisions**:
- Maintained `zod@3.x` for stability and ecosystem compatibility
- Downgraded `better-auth` to `1.0.14` to maintain compatibility with `zod@3.x`
- Updated `@polar-sh/better-auth` to `1.6.0` for latest features

#### Webpack Configuration

Custom Webpack configuration was added to `next.config.ts` to handle Node.js protocol imports (`node:module`, etc.):

```typescript
webpack: (config, { isServer }) => {
  // Handle node: protocol imports
  // Set fallbacks for Node.js modules on client-side
  // See next.config.ts for full implementation
}
```

This configuration:
- Replaces `node:*` imports with standard module names
- Sets fallbacks to `false` for Node.js-only modules in client bundles
- Prevents runtime errors when server-only code is bundled for the browser

#### Known Limitations

**⚠️ Polar Integration Temporarily Disabled**

> **See the [Polar Integration Status](#️-important-polar-integration-status) section above for complete details.**

The `polarClient` plugin from `@polar-sh/better-auth` is currently disabled due to a Node.js compatibility issue in the browser environment.

**Quick Summary**:
- ❌ Polar payments and subscriptions unavailable
- ✅ All authentication features work correctly
- 🔧 Awaiting official fix from Polar team

For resolution options, alternatives, and re-enablement instructions, refer to the dedicated section at the top of this README.

## Installation & Development

### Prerequisites

- Node.js 18+ or 20+
- npm, yarn, pnpm, or bun

### Install Dependencies

```bash
npm install --legacy-peer-deps
```

### Environment Variables

Create a `.env` file in the root directory with the required environment variables:

```env
# Database
DATABASE_URL=your_database_url

# Authentication
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:3000

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Add other required environment variables
```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Database commands
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
```

### Security Verification

To verify the project is not affected by critical vulnerabilities:

```bash
# Check for react2shell vulnerability
npx fix-react2shell-next

# Run npm audit
npm audit

# Fix non-breaking vulnerabilities
npm audit fix --legacy-peer-deps
```

## Tech Stack

- **Framework**: Next.js 15.3.6
- **React**: 19.0.0
- **Authentication**: Better Auth 1.0.14
- **Database ORM**: Drizzle ORM
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **Form Handling**: React Hook Form + Zod
- **Video**: Stream.io Video SDK
- **AI**: OpenAI SDK

## Project Structure

```
next15-meetai/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── (auth)/       # Authentication routes
│   │   └── ...
│   ├── components/       # Reusable components
│   ├── lib/             # Utility functions and configurations
│   │   └── auth-client.ts  # Better Auth client configuration
│   ├── modules/         # Feature modules
│   │   ├── auth/        # Authentication module
│   │   └── dashboard/   # Dashboard module
│   └── db/              # Database schema and configuration
├── public/              # Static assets
├── next.config.ts       # Next.js configuration (includes Webpack customization)
└── package.json         # Dependencies and scripts
```

## Troubleshooting

### Installation Issues

If you encounter dependency conflicts:

1. Delete `node_modules` and `package-lock.json`:
   ```bash
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json -Force
   ```

2. Reinstall with legacy peer deps:
   ```bash
   npm install --legacy-peer-deps
   ```

### Build Issues

If the build fails with module errors:

1. Clear Next.js cache:
   ```bash
   Remove-Item -Recurse -Force .next
   ```

2. Rebuild:
   ```bash
   npm run build
   ```

### Node.js Module Errors

If you see errors about `node:module` or `createRequire`:
- Ensure `next.config.ts` has the Webpack configuration for handling Node.js protocol imports
- Verify that client components have the `"use client"` directive
- Check that server-only code is not imported in client components

## Contributing

When contributing to this project:

1. Always use `npm install --legacy-peer-deps` for package installation
2. Test authentication flows after making changes
3. Run `npm audit` to check for new vulnerabilities
4. Update this README if you make significant configuration changes

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Better Auth Documentation](https://better-auth.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Stream.io Video Documentation](https://getstream.io/video/docs/)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

**Important**: When deploying, ensure:
- All environment variables are configured
- Build command uses: `npm install --legacy-peer-deps && npm run build`
- Node.js version is set to 18.x or 20.x

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

[Add your license here]

## Changelog

### 2025-12-10 - Security Update & Polar Integration Issue

**Security Improvements:**
- ✅ Applied critical security patches
- ✅ Resolved 14 vulnerabilities (from 19 total)
- ✅ Verified not affected by CVE-2025-66478 (react2shell)
- ⚠️ 5 moderate vulnerabilities remain (esbuild, next.js)

**Technical Changes:**
- Configured Webpack for Node.js protocol imports (`node:module`, etc.)
- Updated dependencies for React 19 compatibility
- Added `--legacy-peer-deps` requirement for installations
- Downgraded `better-auth` to 1.0.14 for `zod@3.x` compatibility

**⚠️ Breaking Change - Polar Integration:**
- **DISABLED** `polarClient` plugin in `src/lib/auth-client.ts`
- **Reason**: Compatibility issue with client-side rendering (createRequire error)
- **Impact**: Polar payments and subscriptions temporarily unavailable
- **Status**: Awaiting fix from @polar-sh/better-auth team
- **Workaround**: Manual server-side integration or alternative payment providers

**What Still Works:**
- ✅ User authentication (email/password)
- ✅ OAuth login (Google, GitHub)
- ✅ User registration and management
- ✅ All non-payment features

See [Polar Integration Status](#️-important-polar-integration-status) section for complete details and resolution options.

