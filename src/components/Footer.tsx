
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-softgray">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-primary">DuoHome</span>
              <span className="text-xl font-medium text-gray-700">Advisor</span>
            </Link>
            <p className="mt-4 text-gray-600 max-w-md">
              Helping renters and home buyers in Japan make confident final housing decisions by comparing two shortlisted properties.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Platform</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link to="/compare" className="text-base text-gray-600 hover:text-primary">
                  Compare Properties
                </Link>
              </li>
              <li>
                <Link to="/feed" className="text-base text-gray-600 hover:text-primary">
                  Comparison Feed
                </Link>
              </li>
              <li>
                <Link to="/experts" className="text-base text-gray-600 hover:text-primary">
                  Find Experts
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Company</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link to="/about" className="text-base text-gray-600 hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-base text-gray-600 hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-base text-gray-600 hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-base text-gray-600 hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-500 text-center">
            &copy; {new Date().getFullYear()} DuoHome Advisor. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
