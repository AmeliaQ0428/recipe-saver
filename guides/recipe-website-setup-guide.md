# Setup Guide: Recipe Saver Website

This guide walks you through putting the recipe website online for free. It needs **4 free accounts**, all created with your email (ameliazhangzq428@gmail.com is fine for all of them, or use whatever you prefer — just stay consistent).

No coding is required from you — just clicking through sign-up forms and copying/pasting a few codes ("keys") into the right boxes. I'll tell you exactly what to copy and where it goes.

**Order matters** — do these roughly in this order, since later steps need information from earlier ones.

---

## What you're setting up, in plain terms

| Account | What it's for |
|---|---|
| **GitHub** | Stores the website's code (like a project folder in the cloud) |
| **Vercel** | Hosts the website itself — this is the link you'll share with people |
| **Supabase** | The database — stores the recipes, ratings, steps, etc. |
| **Spoonacular** | The recipe data source — supplies recipes, photos, ratings, and steps |

---

## Step 1 — GitHub (code storage)

1. Go to **github.com** and sign up (free).
2. Once signed in, create a **new repository**:
   - Click the **+** icon (top right) → **New repository**
   - Name it something like `recipe-saver`
   - Leave it **Public** or **Private** — either is fine
   - Don't check any of the "initialize with..." boxes
   - Click **Create repository**
3. Leave the page open — you'll see a URL like `https://github.com/your-username/recipe-saver.git`. Send me that URL and I'll push the website code into it for you.

---

## Step 2 — Supabase (database)

1. Go to **supabase.com** and sign up (free), then click **New project**.
2. Pick any name (e.g. `recipe-saver`) and set a database password — just store it somewhere safe, you likely won't need it again.
3. Wait a minute or two for the project to finish setting up.
4. **Run the database setup scripts:**
   - In the left sidebar, click the **SQL Editor** icon.
   - Click **New query**.
   - I'll give you a block of text (the contents of `supabase/migrations/0001_init.sql`) — paste it into the editor and click **Run**.
   - This creates all the tables the website needs (recipes, cuisines, steps, etc.) and pre-fills the cuisine and meal-type lists.
   - Click **New query** again, paste in the contents of `supabase/migrations/0002_auth_and_notes.sql`, and click **Run**. This adds login support and the "favourites/notes" tables.
   - Click **New query** once more, paste in the contents of `supabase/migrations/0003_recipe_ingredients.sql`, and click **Run**. This adds the table that stores ingredient quantities for each recipe.
5. **Set the Site URL (for login emails):**
   - In the left sidebar, go to **Authentication** → **URL Configuration**.
   - Set **Site URL** to your website's address (you'll get this in Step 4 below — come back and update this once you have it). This makes sure the "confirm your email" link people get when signing up points to the right place.
   - When someone signs up, Supabase automatically emails them a confirmation link — that's normal, just have them click it before logging in.
6. **Copy your project's keys:**
   - In the left sidebar, go to **Project Settings** (gear icon) → **API**.
   - You'll see three values — copy each one and send them to me (or paste them directly into the `.env.local` file / Vercel later, see Step 5):
     - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
     - **Publishable key** (starts with `sb_publishable_...` — older projects may instead call this "anon public") → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **Secret key** (starts with `sb_secret_...` — older projects may instead call this "service_role"; click "Reveal") → this is `SUPABASE_SERVICE_ROLE_KEY`

   ⚠️ The secret/`service_role` key is powerful — treat it like a password. Don't share it publicly or post it anywhere public.

---

## Step 3 — Spoonacular (recipe data)

1. Go to **spoonacular.com/food-api** and click **Start now** / **Sign up** for the free plan.
2. Once signed in, find your **API key** on your profile/dashboard page.
3. Copy it — this is your `SPOONACULAR_API_KEY`.

The free plan gives a 50-point daily quota (each search/recipe call uses roughly 1 point). The daily cache-refresh job is tuned to stay within this, so visitors never trigger extra requests. The quota resets once a day — if you ever see a "daily points limit" error, it'll clear itself within 24 hours.

---

## Step 4 — Vercel (hosting / the actual website)

1. Go to **vercel.com** and sign up using **"Continue with GitHub"** (so it's linked to your GitHub account from Step 1).
2. Click **Add New** → **Project**, then find and **Import** the `recipe-saver` repository.
3. Vercel will detect it's a Next.js project automatically — don't change any build settings.
4. Before clicking Deploy, open **Environment Variables** and add all 5 of these (values from Steps 2–3, plus the cron secret below):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from Supabase → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase → Project Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | from Supabase → Project Settings → API |
   | `SPOONACULAR_API_KEY` | from Spoonacular dashboard |
   | `CRON_SECRET` | `k68zm5wqhp7bc439tel1s2vnfagordij` (already generated for you — just reuse this) |

5. Click **Deploy**. After a minute or two, Vercel gives you a live URL like `https://recipe-saver-yourname.vercel.app` — this is your website!

---

## Step 5 — Fill the recipe cache for the first time

The website only shows recipes that have been "cached" from Spoonacular into your Supabase database. This normally happens automatically once a day, but the database starts **empty**, so we need to run it once manually.

1. Once Vercel shows your site is deployed, open this URL in your browser (replace `YOUR-SITE` with your actual Vercel URL):

   ```
   https://YOUR-SITE.vercel.app/api/cron/refresh-cache?secret=k68zm5wqhp7bc439tel1s2vnfagordij
   ```

2. It may take 10–20 seconds to load. You should see a small message like `{"ok":true,"stats":{...}}`.
3. Now visit your site's homepage — you should see recipes appear under Breakfast, Lunch, Dinner, Dessert, and Snack.

From now on, Vercel automatically re-runs this every day to keep recipes fresh — you don't need to do anything.

---

## After setup — what you can do

- Share the `https://YOUR-SITE.vercel.app` link with anyone to let them browse recipes.
- Use the **Browse** page to search by name, filter by cuisine (Thai, Chinese, Mexican, etc.), meal type, and sort by rating or time.
- Click any recipe to see its rating, ingredients, and step-by-step instructions.
- **Sign up** (top right) to save recipes to **My Cookbook** and keep your own notes on any recipe (substitutions, timing tweaks, etc.) — each person who signs up gets their own list.

Remember to go back to **Authentication → URL Configuration → Site URL** in Supabase once your site is deployed (Step 4) and set it to your live Vercel URL, so sign-up confirmation emails link to the right place.

This covers browsing, search, login, favourites, and personal notes. A future phase could add recording your own recipes step-by-step with your own photos, and liking/commenting on recipes.
