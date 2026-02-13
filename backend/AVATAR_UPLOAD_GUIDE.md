# Avatar Upload Implementation Guide

## Overview
Avatars are now stored as local files on the server instead of base64 strings in the database. This improves performance and reduces database size.

## Backend Changes

### File Storage
- **Location**: `backend/uploads/avatars/`
- **Naming**: `avatar-{timestamp}-{random}.{ext}`
- **Max Size**: 5MB
- **Allowed Types**: JPEG, JPG, PNG, GIF, WEBP

### API Endpoints
- **POST /api/users** - Create user with avatar (multipart/form-data)
- **PUT /api/users/:id** - Update user with avatar (multipart/form-data)
- **GET /uploads/avatars/:filename** - Serve avatar files (static)

### Database
- The `avatar` field in the `users` table stores the filename (e.g., `avatar-1234567890-987654321.jpg`)
- The full URL is constructed as: `http://localhost:3001/uploads/avatars/{filename}`

## Frontend Changes

### File Upload
- Files are sent as `FormData` instead of base64 strings
- File previews use `URL.createObjectURL()` for blob URLs
- Blob URLs are properly cleaned up when dialogs close

### Avatar Display
- Avatar URLs are automatically transformed to full URLs in `dataTransformers.js`
- If no avatar exists, falls back to UI Avatars service

## Usage

### Creating a User with Avatar
```javascript
const formData = new FormData();
formData.append('fullName', 'John Doe');
formData.append('email', 'john@example.com');
formData.append('avatar', fileObject); // File object from input

await usersService.create({
  fullName: 'John Doe',
  email: 'john@example.com',
  avatar: fileObject
});
```

### Updating User Avatar
```javascript
await usersService.update(userId, {
  fullName: 'John Doe',
  avatar: fileObject // New file object
});
```

## File Cleanup
- Old avatar files are automatically deleted when:
  - A user updates their avatar
  - A user is deleted
  - An error occurs during user creation/update

## Notes
- The server must be running to serve avatar files
- Avatar files persist even if the server restarts
- Make sure `backend/uploads/avatars/` directory exists and is writable

