import Nav from './components/Nav';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Contact from './components/Contact';
import { profile } from './data/profile';
import styles from './App.module.css';

function App() {
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

export default App;

