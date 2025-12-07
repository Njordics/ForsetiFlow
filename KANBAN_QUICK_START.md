# ForsetiFlow Kanban - Quick Start Guide

## 🚀 Getting Started

Your kanban board has been enhanced with Trello-like features. Here's how to use them:

## 📊 New Features at a Glance

### 1. Story Points
Add effort estimates to your tasks:
- Click **gear icon** on a card → enter **Story Points**
- Points display as a badge on collapsed cards
- Filter by point ranges in the filter panel

### 2. Card Colors
Visually organize your cards:
- Click **gear icon** → select **Cover Color**
- Choose any color to make cards stand out
- Helps identify priority, team, or category

### 3. Labels
Tag your tasks with multiple labels:
- Currently managed via API
- Each label has its own color
- Future: Click to add labels directly on cards

### 4. Smart Filters
Find exactly what you need:
- **Filter by Story Points**: Select 1-3, 5-8, 13+ point ranges
- **Filter by Due Date**: See Overdue, Today, This week, or This month tasks
- **Reset Filters**: Clear all at once

### 5. Task Details Modal
See everything about a task:
- Click **⧉ button** on any card
- View description, due date, story points, labels
- **Add comments** - Discuss the task
- **Manage checklists** - Check off items as done
- **View attachments** - See linked files

### 6. Comments
Collaborate on tasks:
- Open task modal (⧉ button)
- Type in comment box
- Click "Add comment"
- Comments appear with timestamp

### 7. Checklists
Break down complex tasks:
- Create checklists in task modal
- Add items to each checklist
- Check items as you complete them
- See progress (e.g., 3/5 complete)

### 8. Attachments
Store important files:
- Attach files to tasks
- View all attachments in task modal
- Click links to download

## 💡 Pro Tips

### Organizing with Colors
Use cover colors strategically:
- 🔴 Red = Urgent/Blocker
- 🟠 Orange = High Priority
- 🟡 Yellow = Medium Priority
- 🟢 Green = Low Priority
- 🔵 Blue = Research/Planning
- 🟣 Purple = Design
- ⚫ Black = Under Review

### Effective Story Pointing
- **1-3 points**: Quick fixes, simple tasks
- **5-8 points**: Standard tasks
- **13+ points**: Complex work, may need breaking down

### Using Filters Together
1. Filter by **This month** due date
2. Further filter by **5-8 points**
3. Now see all medium-effort tasks due this month
4. Work through them systematically

### Workflow Tips
1. **To Do**: All new tasks start here
2. **In Progress**: Tasks you're actively working on
3. **Done**: Completed tasks (move here to celebrate!)
4. **Later**: Ideas for future work

## 🎯 Daily Workflow Example

```
9:00 AM  - Start day, check "This week" filter for due tasks
9:30 AM  - Pick highest priority task, move to "In Progress"
10:00 AM - Add comment "Started working on this"
11:00 AM - Create checklist with sub-tasks
12:00 PM - Check off completed items
2:00 PM  - Finish task, move to "Done"
3:00 PM  - Review backlog, add new ideas to "Later"
4:00 PM  - Filter by "Overdue" to catch any missed deadlines
5:00 PM  - Check all comments for updates
```

## 🔗 API Reference (For Developers)

### Endpoints You Can Use

```bash
# Get task with all details
curl /api/projects/{project_id}/tasks

# Add a comment
curl -X POST /api/tasks/{task_id}/comments \
  -d '{"comment_text": "Great work!"}'

# Create a checklist
curl -X POST /api/tasks/{task_id}/checklists \
  -d '{"checklist_title": "Implementation"}'

# Add checklist item
curl -X POST /api/checklists/{checklist_id}/items \
  -d '{"item_text": "Write unit tests"}'

# Update task with story points
curl -X PATCH /api/tasks/{task_id} \
  -d '{"story_points": 8, "cover_color": "#3b82f6"}'
```

## 📱 Mobile Usage

- Swipe to scroll between columns
- Tap ⧉ to view task details
- Tap gear to edit quick fields
- Comments and checklists work on mobile
- Filters available on mobile

## ⌨️ Keyboard Tips

- `Esc` - Close task modal
- Tab through form fields for quick entry
- Enter to submit forms

## 🆘 Troubleshooting

### "Story points not showing"
- Add a point value and click Save
- Story points only show when > 0

### "Filter showing no tasks"
- Check if you have tasks matching criteria
- Try resetting filters
- Refresh page

### "Comments not saving"
- Ensure you're logged in
- Check browser console for errors
- Verify internet connection

### "Colors not applying"
- Click Save after changing color
- Try different color format

## 📚 Learn More

See full documentation:
- `KANBAN_FEATURES.md` - Complete feature list
- `TRELLO_COMPARISON.md` - How it compares to Trello
- `KANBAN_IMPLEMENTATION_SUMMARY.md` - Technical details

## 🎓 Advanced Usage

### Filtering Workflow
Save time by creating filter combinations:
1. **Sprint Ready**: Story points 5-8, due this week
2. **Quick Wins**: Story points 1-3, due today
3. **Backlog Review**: No estimate, status = Later

### Checklist Best Practices
- Break 13+ point tasks into 5-8 point subtasks
- Create acceptance criteria checklists
- Use for QA testing checklists

### Comment Best Practices
- @mention team members (will be added later)
- Link to related issues
- Share quick updates without leaving app

### Label Strategy
- Keep to 5-10 project labels
- Use consistently across tasks
- Examples: `backend`, `frontend`, `database`, `api`, `urgent`

## 🚀 Next Steps

1. **Try it now**: Create a task with story points
2. **Set a color**: Make your first card colorful
3. **Add a comment**: Start collaborating
4. **Create a checklist**: Break down a big task
5. **Use filters**: Find high-priority work

## 📞 Need Help?

Check these in order:
1. This Quick Start Guide
2. KANBAN_FEATURES.md documentation
3. Browser console (F12) for error messages
4. Check app logs

## 🎉 You're Ready!

Your Kanban board is now fully featured and ready for production use. Start organizing, collaborating, and shipping! 

Happy project managing! 🚀
