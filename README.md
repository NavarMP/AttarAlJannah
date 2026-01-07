# عطر الجنّة (Attar Al Jannah) - E-commerce PWA

A modern, aesthetic Progressive Web App for selling premium Attar with an integrated sales challenge system for students.

![App Preview](./attar.png)

## 🌟 Features

### ✅ Completed Features

#### 🏠 Landing Page
- **Animated Hero Section** with Arabic title "عطر الجنّة"
- **GSAP Animations**: Floating product image, parallax scrolling, reveal effects
- **Smooth Scrolling** powered by Lenis
- **Custom Cursor** with trailing effect (desktop only)
- **Islamic Design Theme** with emerald and gold color scheme
- **Product Details** with glassmorphic cards
- **Action Buttons**: Buy Now, Student Login, Track Order, Web Share API

#### 🛒 Order Form
- **React Hook Form** with Zod validation
- **Dual Payment Options**: Cash on Delivery (COD) & UPI
- **UPI Payment Flow**: QR code display, payment screenshot upload
- **Dynamic Pricing** calculation
- **Success Animation** on order submission
- **File Upload** with preview for payment screenshots
- **API Integration** with Supabase for order storage

#### 👨‍🎓 Student Portal
- **Student Login** with phone number or ID
- **Dashboard** with sales progress tracking
  - Visual progress bar towards 20 sales goal
  - Statistics: Verified Sales, Pending Orders, Total Earnings
  - Congratulations message on goal achievement
- **Enter New Order** functionality (orders auto-tagged to student)
- **Protected Routes** with client-side authentication

#### 🎨 Design & UI/UX
- **Theme Support**: Light, Dark, and System themes
- **Responsive Design**: Mobile-first approach
- **Glassmorphism Effects** throughout the app
- **Islamic Geometric Patterns** as background elements
- **Custom Color Palette**: Emerald greens and golds
- **Typography**: Geist Sans for English, Amiri for Arabic
- **Micro-animations** and hover effects
- **PWA Icons** with Islamic design

#### 🔧 Technical Implementation
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn/UI** components
- **Supabase** for database and storage
- **GSAP** for advanced animations
- **Lenis** for smooth scrolling
- **Framer Motion** ready for page transitions

### 📋 Pending Features

#### 👥 Admin Panel (To Be Implemented)
- Admin login page
- Order management dashboard
- Payment screenshot viewer
- Order status actions (Verify, Confirm, Deliver)
- Student leaderboard
- Order filtering and search

#### 📦 Customer Tracking (To Be Implemented)
- OTP-based customer login
- Order history view
- Order tracking timeline

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- A Supabase account ([create one here](https://supabase.com))

### Installation

1. **Clone the repository**
   ```bash
   cd /Users/apple/Desktop/Web/AttarChallenge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Follow the guide in `SUPABASE_SETUP.md`
   - Create your database tables
   - Set up storage bucket for payment screenshots
   - Insert sample data

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 📱 PWA Installation

The app is installable as a Progressive Web App:

1. **On Mobile (Chrome/Safari)**:
   - Visit the website
   - Tap the "Add to Home Screen" prompt
   - Or use browser menu → "Install App"

2. **On Desktop (Chrome/Edge)**:
   - Visit the website
   - Look for the install icon in the address bar
   - Or use browser menu → "Install Attar Al Jannah"

## 🗂️ Project Structure

```
AttarChallenge/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── orders/create/        # Order creation endpoint
│   │   └── student/              # Student authentication & progress
│   ├── order/                    # Public order page
│   ├── student/                  # Student portal
│   │   ├── login/                # Student login
│   │   ├── dashboard/            # Student dashboard
│   │   └── new-order/            # Student order entry
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # Shadcn/UI components
│   ├── custom/                   # Custom components (cursor, theme toggle)
│   ├── sections/                 # Page sections (hero, product details, etc.)
│   ├── forms/                    # Form components
│   └── providers/                # Context providers
├── lib/
│   ├── supabase/                 # Supabase clients & types
│   ├── validations/              # Zod schemas
│   └── utils.ts                  # Utility functions
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   ├── icon-192.png              # PWA icon (192x192)
│   ├── icon-512.png              # PWA icon (512x512)
│   ├── attar.png                 # Product image
│   ├── attar.jpg                 # Alternative product image
│   └── attar2.jpg                # Alternative product image
├── SUPABASE_SETUP.md             # Database setup guide
└── README.md                     # This file
```

## 🎯 User Flows

### Customer Journey
1. **Land on homepage** → View product details
2. **Click "Buy Now"** → Fill order form
3. **Select payment** → COD or UPI (with screenshot)
4. **Submit order** → See success animation
5. **Track order** → (To be implemented)

### Student Journey
1. **Click "Student Login"** → Enter phone/ID
2. **View dashboard** → See sales progress
3. **Click "Enter New Order"** → Fill customer details
4. **Submit order** → Order tagged to student account
5. **Track progress** → Monitor verified sales towards goal

### Admin Journey (To Be Implemented)
1. Login to admin panel
2. View all orders
3. Verify payments (view screenshots)
4. Update order statuses
5. View student leaderboard

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **UI Components** | Shadcn/UI |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage |
| **Animations** | GSAP, Lenis, Framer Motion |
| **Forms** | React Hook Form + Zod |
| **State** | React Context + localStorage |
| **Themes** | next-themes |
| **Icons** | Lucide React |
| **Notifications** | Sonner |

## 📊 Database Schema

### Users Table
- ID, Name, Phone, Role (admin/student/customer), Address, Total Sales

### Orders Table
- ID, Customer Details, Product, Quantity, Price, Payment Method/Status, Order Status, Screenshot URL, Referred By (Student ID)

### Challenge Progress Table
- ID, Student ID, Verified Sales, Goal (20), Updated At

## 🎨 Design System

### Colors
- **Primary**: Emerald Green (`#10b981`)
- **Accent**: Gold (`#eab308`)
- **Background**: Adaptive (Light/Dark)
- **Islamic Patterns**: Geometric overlays in emerald/gold

### Typography
- **English**: Geist Sans
- **Arabic**: Amiri

### Effects
- **Glassmorphism**: Frosted glass cards
- **Animations**: GSAP-powered smooth transitions
- **Smooth Scroll**: Lenis integration
- **Custom Cursor**: Desktop-only trailing effect

## 🔐 Security Notes

⚠️ **For Development Only**:
- RLS (Row Level Security) is currently disabled
- Service role key should never be exposed to client
- Before production deployment:
  - Enable RLS with proper policies
  - Implement secure authentication
  - Add rate limiting
  - Set up email verification

## 📝 TODO / Future Enhancements

- [ ] Admin panel implementation
- [ ] Customer OTP tracking system
- [ ] Email notifications for order updates
- [ ] SMS integration for OTP
- [ ] Student earnings calculator
- [ ] Bulk order management
- [ ] Analytics dashboard
- [ ] Invoice generation
- [ ] WhatsApp integration
- [ ] Multi-product support

## 🤝 Contributing

This is a custom project for Minhajul Jannah Dars. For questions or support, contact the development team.

## 📄 License

Proprietary - © 2026 Minhajul Jannah Dars

---

**Built with ❤️ for the students of Minhajul Jannah**
