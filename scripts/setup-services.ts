import { db } from "@/lib/db"

const services = [
  {
    title: "Audio Equipment Training",
    description: "Empower Your Team with Expert Audio Training\n\nWe provide hands-on training for church staff and volunteers to confidently operate audio equipment. Our sessions cover everything from basic soundboard functions to advanced techniques, ensuring your team delivers clear, balanced audio for every service.",
    price: 499.99,
    features: [
      "Comprehensive Training Sessions: From beginner to advanced levels",
      "Soundboard Operation: Master the basics and advanced mixing techniques",
      "Microphone Management: Proper placement and usage for optimal sound",
      "Troubleshooting Tips: Quickly identify and resolve common audio issues",
      "Customized Training Materials: Tailored to your specific audio setup",
      "Ongoing Support: Access to training resources and follow-up assistance"
    ],
    category: "Services"
  },
  {
    title: "Equipment Analysis",
    description: "Optimize Your Setup with Professional Equipment Analysis\n\nOur experts conduct a comprehensive assessment of your current audio and streaming equipment. We identify strengths, pinpoint issues, and recommend upgrades or adjustments to optimize your setup for high-quality sound and video production.",
    price: 299.99,
    features: [
      "Detailed Equipment Assessment: Comprehensive review of all audio and streaming gear",
      "Performance Evaluation: Identify strengths and areas for improvement",
      "Issue Identification: Pinpoint technical problems affecting performance",
      "Upgrade Recommendations: Suggest the best upgrades for enhanced quality",
      "Cost-Benefit Analysis: Provide insights on investment vs. performance gains",
      "Action Plan: Step-by-step recommendations for optimal setup"
    ],
    category: "Services"
  },
  {
    title: "Sound Optimization",
    description: "Achieve Perfect Sound with Expert Sound Optimization\n\nWe fine-tune your audio system to achieve clear, balanced sound throughout the entire worship space. Our specialists adjust settings, reduce feedback, and enhance audio clarity to create an immersive and distraction-free worship experience.",
    price: 399.99,
    features: [
      "System Calibration: Fine-tune audio settings for optimal performance",
      "Feedback Reduction: Implement strategies to minimize and eliminate feedback",
      "Audio Clarity Enhancement: Improve sound quality for clearer sermons and music",
      "Speaker Placement Optimization: Ensure even sound distribution across the venue",
      "EQ Adjustments: Customize equalization to suit your specific acoustics",
      "Ongoing Monitoring: Regular checks to maintain sound quality"
    ],
    category: "Services"
  },
  {
    title: "Monthly Maintenance",
    description: "Keep Your Systems Running Smoothly with Monthly Maintenance\n\nPrevent audio and streaming issues before they arise with our monthly maintenance service. We inspect, clean, and test all equipment to ensure it operates at peak performance, keeping your system reliable and ready for every service.",
    price: 199.99,
    features: [
      "Regular Inspections: Thorough checks of all audio and streaming equipment",
      "Cleaning Services: Remove dust and debris to maintain equipment longevity",
      "Performance Testing: Ensure all systems are functioning correctly",
      "Firmware Updates: Keep your equipment up-to-date with the latest software",
      "Preventative Repairs: Address potential issues before they become problems",
      "Maintenance Reports: Detailed documentation of all maintenance activities"
    ],
    category: "Services"
  },
  {
    title: "Live Service Audio Support",
    description: "Seamless Audio for Every Live Service\n\nOur team provides on-site or remote audio support during live services. We ensure that microphones, instruments, and other audio components are properly mixed and monitored to deliver seamless sound throughout the worship experience.",
    price: 299.99,
    features: [
      "On-Site Support: Professional audio technicians present during services",
      "Remote Support: Virtual assistance for audio setup and troubleshooting",
      "Real-Time Mixing: Balance audio levels for clear and consistent sound",
      "Equipment Monitoring: Continuous oversight of all audio components",
      "Immediate Issue Resolution: Quickly address and fix any audio problems",
      "Customized Audio Setup: Tailored to your specific service requirements"
    ],
    category: "Services"
  },
  {
    title: "Live Service Broadcasting Support",
    description: "Expand Your Reach with Professional Live Broadcasting\n\nEnhance your church's reach with our live broadcasting support. We handle all aspects of streaming, including video and audio integration, platform setup, and real-time monitoring, ensuring a professional-quality broadcast for your online congregation.",
    price: 399.99,
    features: [
      "Comprehensive Streaming Setup: Integrate video and audio for seamless broadcasts",
      "Platform Configuration: Setup and optimize streaming on Facebook, YouTube, and your website",
      "Real-Time Monitoring: Ensure smooth streaming with live oversight",
      "Custom Graphics & Overlays: Enhance broadcasts with professional visuals",
      "Post-Event Editing: Provide edited recordings for on-demand viewing",
      "Technical Support: Ongoing assistance to resolve any streaming issues"
    ],
    category: "Services"
  }
];

async function setupServices() {
  console.log("Setting up predefined services...");

  for (const service of services) {
    try {
      const existingService = await db.query(
        'SELECT * FROM products WHERE title = $1 AND category = $2',
        [service.title, service.category]
      );

      if (existingService.rows.length === 0) {
        await db.query(
          `INSERT INTO products (title, description, price, features, category, is_service, status)
           VALUES ($1, $2, $3, $4, $5, true, 'active')`,
          [service.title, service.description, service.price, service.features, service.category]
        );
        console.log(`Created service: ${service.title}`);
      } else {
        console.log(`Service already exists: ${service.title}`);
      }
    } catch (error) {
      console.error(`Error creating service ${service.title}:`, error);
    }
  }

  console.log("Finished setting up predefined services!");
}

setupServices().catch(console.error); 