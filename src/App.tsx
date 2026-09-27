import { A, Route, Router } from '@solidjs/router';
import type { JSX } from 'solid-js';
import Nav from './components/Nav';
import Hero from './components/Hero';
import About from './components/About';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Education from './components/Education';
import Extras from './components/Extras';
import Contact from './components/Contact';
import { SiteProvider, useSite } from './stores/site';
import AdminLayout from './components/admin/AdminLayout';
import DashboardHome from './components/admin/DashboardHome';
import AccountPage from './components/admin/AccountPage';
import ProfilePage from './components/admin/ProfilePage';
import ProjectsPage from './components/admin/ProjectsPage';
import ExperiencePage from './components/admin/ExperiencePage';
import EducationPage from './components/admin/EducationPage';
import ExtrasPage from './components/admin/ExtrasPage';
import SocialLinksPage from './components/admin/SocialLinksPage';
import AnalyticsPage from './components/admin/AnalyticsPage';
import AuditLogPage from './components/admin/AuditLogPage';
import SkillsPage from './components/admin/SkillsPage';
import { AuthProvider } from './stores/auth';
import { profile } from './data/profile';
import styles from './App.module.css';

function PublicSite() {
  const site = useSite();
  const name = () => site.profile()?.full_name || profile.name;

  return (
    <>
      <a class="skip-link" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Education />
        <Extras />
        <Contact />
      </main>
      <footer class={styles.footer}>
        <div class="container">
          <p>
            Built with SolidJS and Vite — © {new Date().getFullYear()} {name()}
          </p>
        </div>
      </footer>
    </>
  );
}

function PublicRoute() {
  return (
    <SiteProvider>
      <PublicSite />
    </SiteProvider>
  );
}

function AdminRoute(props: { children?: JSX.Element }) {
  return (
    <AuthProvider>
      <AdminLayout>{props.children}</AdminLayout>
    </AuthProvider>
  );
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
      <Route path="/" component={PublicRoute} />
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
