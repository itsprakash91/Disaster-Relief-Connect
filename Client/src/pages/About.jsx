import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-blue-700 mb-6 text-center">
        About DisasterRelief Connect
      </h1>

      <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-blue-600 mb-3">
            Our Mission
          </h2>
          <p className="text-gray-700 leading-relaxed">
            DisasterRelief Connect is a platform designed to bring together disaster
            victims, volunteers, and donors in times of crisis. We aim to
            create a seamless connection between those who need help and those
            who are willing to provide support, making disaster relief more
            efficient and organized.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-blue-600 mb-3">
            How It Works
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-lg mb-1">For Victims</h3>
              <p className="text-gray-700">
                Register and create help requests for food, water, medical
                assistance, shelter, or rescue. Your location is automatically
                shared so volunteers can find and help you quickly.
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-lg mb-1">For Volunteers</h3>
              <p className="text-gray-700">
                Sign up as a volunteer to view nearby help requests on the map.
                Accept requests and provide assistance to those in need.
              </p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-semibold text-lg mb-1">For Donors</h3>
              <p className="text-gray-700">
                Make secure donations through our payment gateway to support
                relief efforts and help those affected by floods.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-blue-600 mb-3">
            Features
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Real-time map showing help requests in your area</li>
            <li>Geolocation-based request matching</li>
            <li>Secure donation system</li>
            <li>Admin dashboard for coordination</li>
            <li>Volunteer management system</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-blue-600 mb-3">
            Get Involved
          </h2>
          <div className="flex gap-4 justify-center">
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all"
            >
              Register Now
            </Link>
            <Link
              to="/donate"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all"
            >
              Make a Donation
            </Link>
            <Link
              to="/map"
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg transition-all"
            >
              View Map
            </Link>
          </div>
        </section>

        <section className="pt-6 border-t">
          <p className="text-gray-600 text-center">
            Built with ❤️ to help communities in times of need
          </p>
        </section>
      </div>
    </div>
  );
}

