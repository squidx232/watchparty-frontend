# pillow watch

a cozy watch party app for watching videos together with friends in real-time.

## why i built this

i wanted to have a watch party with my friends, but every website i tried was either:
- not optimized and clunky
- behind a paywall
- slow and laggy
- just didn't feel right

so i built my own.

## features

- **real-time sync** - everyone sees the same thing at the same time
- **cloud browser** - powered by hyperbeam, no extensions needed
- **live chat** - talk with your friends while watching
- **simple rooms** - create a room, share the link, done
- **notification sounds** - hear when someone sends a message

## tech stack

- next.js 14
- react 18
- typescript
- tailwind css
- socket.io client
- hyperbeam sdk

## getting started

```bash
# install dependencies
npm install

# create .env.local with your backend url
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001

# run development server
npm run dev

# build for production
npm run build
npm run start
```

## future plans

things i want to add to scale this:

- [ ] user accounts and authentication
- [ ] room history and favorites
- [ ] custom themes and room customization
- [ ] screen sharing option
- [ ] voice chat integration
- [ ] mobile app version
- [ ] playlist queue system
- [ ] room moderation tools
- [ ] live music radio playing in sync
- [ ] analytics dashboard
- [ ] premium features for power users

## links

- frontend: [github.com/squidx232/watchparty-frontend](https://github.com/squidx232/watchparty-frontend)
- backend: [github.com/squidx232/watchparty-backend](https://github.com/squidx232/watchparty-backend)
- live: [pillow-watch.netlify.app](https://pillow-watch.netlify.app)

---

built by [@whereishassan](https://linkedin.com/in/whereishassan)
