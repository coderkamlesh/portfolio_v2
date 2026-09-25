import { A, Route, Router } from '@solidjs/router';
import type { JSX } from 'solid-js';
import Nav from './components/Nav';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Contact from './components/Contact';
import AdminLayout from './components/admin/AdminLayout';
import DashboardHome from './components/admin/DashboardHome';
import SectionPlaceholder from './components/admin/SectionPlaceholder';
import AccountPage from './components/admin/AccountPage';
import ProfilePage from './components/admin/ProfilePage';
import { AuthProvider } from './stores/auth';
import { profile } from './data/profile';
import styles from './App.module.css';

function PublicSite() {
  return (
    <>
      <a class="skip-link" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <About />
        <Projects />
        <Contact />
      </main>
      <footer class={styles.footer}>
        <div class="container">
          <p>
            Built with SolidJS and Vite — © {new Date().getFullYear()} {profile.name}
          </p>
        </div>
      </footer>
    </>
  );
}

function AdminRoute(props: { children?: JSX.Element }) {
  return (
    <AuthProvider>
      <AdminLayout>{props.children}</AdminLayout>
    </AuthProvider>
  );
}

function ProjectsPage() {
  return <SectionPlaceholder title="Projects" />;
}

function SkillsPage() {
  return <SectionPlaceholder title="Skills" />;
}

function ExperiencePage() {
  return <SectionPlaceholder title="Experience" />;
}

function EducationPage() {
  return <SectionPlaceholder title="Education" />;
}

function ExtrasPage() {
  return <SectionPlaceholder title="Extras" />;
}

function SocialLinksPage() {
  return <SectionPlaceholder title="Social Links" />;
}

function AnalyticsPage() {
  return <SectionPlaceholder title="Analytics" />;
}

function AuditLogPage() {
  return <SectionPlaceholder title="Audit Log" />;
}

function NotFound() {
  return (
    <main class="container" style={{ padding: '4rem 0' }}>
      <h1>Page not found</h1>
      <p>
        <A href="/">Back to home</A>
      </p>
    </main>
  );
}

function App() {
  return (
    <Router>
      <Route path="/" component={PublicSite} />
      <Route path="/admin" component={AdminRoute}>
        <Route path="/" component={DashboardHome} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/projects" component={ProjectsPage} />
        <Route path="/skills" component={SkillsPage} />
        <Route path="/experience" component={ExperiencePage} />
        <Route path="/education" component={EducationPage} />
        <Route path="/extras" component={ExtrasPage} />
        <Route path="/social-links" component={SocialLinksPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/audit-log" component={AuditLogPage} />
        <Route path="/account" component={AccountPage} />
      </Route>
      <Route path="*404" component={NotFound} />
    </Router>
  );
}

export default App;
