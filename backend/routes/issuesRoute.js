import { Router } from "express";
import Issue from "../models/Issue.js";

export const issuesRouter = Router();

issuesRouter.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const issues = await Issue.find(query).sort({ createdAt: -1 });
    res.json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({ error: "Failed to fetch issues" });
  }
});

issuesRouter.post("/", async (req, res) => {
  try {
    const issue = await Issue.create(req.body);
    res.status(201).json(issue);
  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(500).json({ error: "Failed to create issue" });
  }
});

issuesRouter.put("/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.status === "resolved" || updates.status === "closed") {
      updates.resolvedAt = new Date();
    }

    const issue = await Issue.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    res.json(issue);
  } catch (error) {
    console.error("Error updating issue:", error);
    res.status(500).json({ error: "Failed to update issue" });
  }
});
