import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <article className="method">
      <h2>Page not found</h2>
      <p>That address is not part of chokepoint.</p>
      <p>
        <Link to="/">Back to passage status</Link>
      </p>
    </article>
  );
}
