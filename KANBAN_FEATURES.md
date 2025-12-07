# ForsetiFlow Kanban Enhancement - Trello-like Features

## Overview
The kanban board has been significantly enhanced with advanced features inspired by Trello, making it a powerful project management tool.

## New Features

### 1. **Story Points Estimation**
- Add story point estimates to tasks (0-∞)
- Visible badge on collapsed cards showing points at a glance
- Editable in the card's edit panel
- Helps with sprint planning and workload estimation

### 2. **Card Labels/Tags**
- Add multiple colored labels to cards
- Color-coded for quick visual identification
- Stored in the database and displayed on cards
- Can be removed and re-added as needed

### 3. **Cover Colors**
- Set custom background colors for cards
- Helps organize tasks by team/priority/theme
- Color picker in the edit panel
- Cards display the cover color bar at the top

### 4. **Advanced Filtering**
- **Filter by Story Points**: View only tasks with specific point ranges
  - No estimate (0 points)
  - 1-3 points (small tasks)
  - 5-8 points (medium tasks)
  - 13+ points (large tasks)
  
- **Filter by Due Date**: View only tasks with matching due dates
  - Overdue: Tasks past their due date
  - Today: Tasks due today
  - This week: Tasks due within 7 days
  - This month: Tasks due within 30 days
  
- **Reset Filters**: Clear all filters with one click

### 5. **Expanded Card Detail Modal**
Click the ⧉ button on any card to open a detailed view with:

#### Comments Section
- View all comments on a task
- Add new comments
- Comments show author and date
- Comments are stored and persist across sessions

#### Checklists Section
- View all checklists attached to the task
- Check off items as they're completed
- See progress (e.g., 3/5 items completed)
- Interactive checkboxes update immediately

#### Attachments Section
- View all files attached to the task
- Download attachments via links
- Track file uploads

#### Task Details
- Complete task information at a glance
- Due date, status, story points, labels
- Full description display
- Parent task reference

### 6. **Enhanced Card Display**
- **Story Points Badge**: Visible when story points > 0
- **Due Date Badge**: Shows due date when collapsed
- **Labels Display**: Colored labels displayed on cards
- **Cover Bar**: Background color bar when set
- **Expand/Collapse**: Toggle between compact and full view
- **Edit Button**: Quick access to edit details
- **Open Modal**: View full card details

### 7. **Database Structure**

New tables created to support advanced features:

#### `task_labels`
- Many-to-many relationship between tasks and labels
- Stores label name and color
- Unique constraint on (task_id, label_name)

#### `task_comments`
- Stores comments on tasks
- Links to user and task
- Timestamp for when comment was added

#### `task_checklists`
- Parent checklist containers
- Associated with tasks
- Has many items

#### `checklist_items`
- Individual checklist items
- Has completion status
- Ordered within checklist

#### `task_attachments`
- File attachments for tasks
- Stores file name, URL, and size
- Tracks uploader and upload time

#### `project_labels`
- Predefined labels for projects (for future use)
- Color and name
- Project-specific scope

### 8. **Backend API Endpoints**

#### Comments
- `GET /api/tasks/<task_id>/comments` - List all comments
- `POST /api/tasks/<task_id>/comments` - Add a comment
- `DELETE /api/tasks/<task_id>/comments/<comment_id>` - Delete a comment

#### Labels
- `GET /api/tasks/<task_id>/labels` - List all labels on a task
- `POST /api/tasks/<task_id>/labels` - Add a label to a task
- `DELETE /api/tasks/<task_id>/labels/<label_name>` - Remove a label

#### Checklists
- `GET /api/tasks/<task_id>/checklists` - List all checklists
- `POST /api/tasks/<task_id>/checklists` - Create a new checklist
- `POST /api/checklists/<checklist_id>/items` - Add item to checklist
- `PATCH /api/checklist-items/<item_id>` - Update item (complete/edit)
- `DELETE /api/checklist-items/<item_id>` - Delete item

#### Attachments
- `GET /api/tasks/<task_id>/attachments` - List all attachments
- `POST /api/tasks/<task_id>/attachments` - Add an attachment
- `DELETE /api/tasks/<task_id>/attachments/<attachment_id>` - Delete attachment

#### Enhanced Task Fields
- `story_points` (integer): Story point estimate
- `cover_color` (text): Background color hex code
- `labels` (text): Serialized labels
- `created_at` (timestamp): When task was created
- `updated_at` (timestamp): Last modification time

## Usage Guide

### Creating a Task with Story Points
1. Click "Add" in any column
2. Fill in task name, description, and due date
3. Enter story points estimate
4. Click "Save"

### Adding Labels to a Task
1. Open the card's edit panel (gear icon)
2. Labels can be managed through the card modal
3. Future versions will have direct label management

### Setting Card Cover Color
1. Open the card's edit panel (gear icon)
2. Click the color picker next to "Cover Color"
3. Select your desired color
4. Click "Save"

### Filtering Tasks
1. Use the filter dropdowns at the top of the kanban board
2. Select "Filter by story points" to view specific point ranges
3. Select "Filter by due date" to view tasks with matching dates
4. Click "Reset filters" to clear all filters

### Viewing Task Details
1. Click the ⧉ button on any card
2. View all task information, comments, checklists, and attachments
3. Add comments from the modal
4. Check off checklist items
5. Click the X or outside the modal to close

### Managing Checklists
1. Open task detail modal (⧉ button)
2. Navigate to "Checklists" section
3. Check items as they're completed
4. Progress updates in real-time

### Adding Comments
1. Open task detail modal (⧉ button)
2. Navigate to "Comments" section
3. Type your comment in the text area
4. Click "Add comment"
5. Comments appear immediately

## Keyboard Shortcuts (Future)
- `Esc` - Close card modal
- `C` - Open card modal from card view
- `N` - Create new task in current column

## Technical Details

### Frontend Components
- **Enhanced Template**: Updated kanban card template with new elements
- **CSS Styling**: Added styles for labels, story points, modals, filters
- **JavaScript Logic**: 
  - Filter matching algorithm for story points and dates
  - Modal management for card details
  - API calls for comments, checklists, attachments

### Database Migrations
All new tables are created automatically via `init_db()` if they don't exist. The migration system uses try/except for ALTER TABLE operations to ensure idempotency.

### Performance Considerations
- Labels are loaded with task data in list queries
- Checklists and comments are lazy-loaded when modal opens
- Filtering is done client-side for instant response
- All operations are optimized with proper indexing recommendations

## Future Enhancements

1. **Drag & Drop Labels**: Assign labels directly on cards
2. **Bulk Operations**: Select multiple cards to apply changes
3. **Card Templates**: Save and reuse card configurations
4. **Due Date Notifications**: Alert for upcoming due dates
5. **Activity Timeline**: See full history of changes
6. **Custom Fields**: Add project-specific metadata
7. **Card Cloning**: Duplicate cards with one click
8. **Power-Ups**: Integrate with external services (Slack, etc.)
9. **Automation**: Rules-based card movements and updates
10. **Performance Mode**: Virtualization for large boards

## Troubleshooting

### Cards not showing filters
- Check browser console for errors
- Refresh the page
- Ensure filters are properly bound in tasks.js

### Modal not opening
- Verify card has task_id data attribute
- Check browser console for API errors
- Ensure all API endpoints are working

### Labels not saving
- Check network tab in browser DevTools
- Verify task_labels table exists in database
- Check app.py for label endpoint issues

### Filters not working
- Ensure dates are in YYYY-MM-DD format
- Check story_points are numeric values
- Try resetting filters and reapplying

## Support
For issues or feature requests, please check the app logs and browser console for detailed error messages.
