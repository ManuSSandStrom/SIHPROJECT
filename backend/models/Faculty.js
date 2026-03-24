import mongoose from "mongoose";

const TimeSlotSchema = new mongoose.Schema(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false } 
);

const FacultySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    employeeId: { type: String, trim: true, uppercase: true },
    department: { type: String, required: true },
    designation: { type: String, trim: true, default: "Lecturer" },
    phone: { type: String, trim: true },
    officeLocation: { type: String, trim: true },
    specialization: [{ type: String }],
    assignedSubjects: [
      {
        subjectName: { type: String, trim: true },
        courseCode: { type: String, trim: true, uppercase: true },
        department: { type: String, trim: true },
        semester: { type: Number },
        section: { type: String, trim: true },
      },
    ],
    availability: {
      monday: [TimeSlotSchema],
      tuesday: [TimeSlotSchema],
      wednesday: [TimeSlotSchema],
      thursday: [TimeSlotSchema],
      friday: [TimeSlotSchema],
      saturday: [TimeSlotSchema],
      sunday: [TimeSlotSchema],
    },
    maxHoursPerWeek: { type: Number, required: true },
    preferences: {
      preferredTimeSlots: [{ type: String }],
      avoidTimeSlots: [{ type: String }],
    },
  },
  {
    timestamps: true, 
  }
);

const Faculty = mongoose.model("Faculty", FacultySchema);

export default Faculty;
