$(document).ready(function() {
    const API_URL = 'https://usmanlive.com/wp-json/api/stories/';
    let isEditing = false;
    const DOG_API_URL = 'https://dog.ceo/api/breeds/image/random';

    // Load stories when page loads
    loadStories();

    // Form submit handler with validations
    $('#storyForm').on('submit', function(e) {
        e.preventDefault();
        
        // Get form values and trim whitespace
        const title = $('#title').val().trim();
        const content = $('#content').val().trim();
        const id = $('#storyId').val();

        // Validation checks
        let isValid = true;
        let errorMessage = '';

        // Title validations
        if (title.length === 0) {
            showError('title', 'Title is required');
            isValid = false;
        } else if (title.length < 3) {
            showError('title', 'Title must be at least 3 characters long');
            isValid = false;
        } else if (title.length > 50) {
            showError('title', 'Title cannot exceed 50 characters');
            isValid = false;
        } else {
            removeError('title');
        }

        // Content validations
        if (content.length === 0) {
            showError('content', 'Content is required');
            isValid = false;
        } else if (content.length < 10) {
            showError('content', 'Content must be at least 10 characters long');
            isValid = false;
        } else if (content.length > 1000) {
            showError('content', 'Content cannot exceed 1000 characters');
            isValid = false;
        } else {
            removeError('content');
        }

        if (isValid) {
            // Show loading state
            $('#submitBtn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i>Processing...');
            
            if (isEditing) {
                updateStory(id, title, content);
            } else {
                createStory(title, content);
            }
        }
    });

    // Real-time validation as user types
    $('#title, #content').on('input', function() {
        const field = $(this).attr('id');
        const value = $(this).val().trim();
        
        if (field === 'title') {
            if (value.length > 0 && value.length < 3) {
                showError(field, 'Title must be at least 3 characters long');
            } else if (value.length > 50) {
                showError(field, 'Title cannot exceed 50 characters');
            } else {
                removeError(field);
            }
        } else if (field === 'content') {
            if (value.length > 0 && value.length < 10) {
                showError(field, 'Content must be at least 10 characters long');
            } else if (value.length > 1000) {
                showError(field, 'Content cannot exceed 1000 characters');
            } else {
                removeError(field);
            }
        }
    });

    // Show error message
    function showError(field, message) {
        removeError(field);
        const errorDiv = $(`<div class="invalid-feedback">${message}</div>`);
        $(`#${field}`).addClass('is-invalid').after(errorDiv);
    }

    // Remove error message
    function removeError(field) {
        $(`#${field}`).removeClass('is-invalid').next('.invalid-feedback').remove();
    }

    // Create new story
    function createStory(title, content) {
        $.ajax({
            url: API_URL,
            method: 'POST',
            data: { title, content },
            success: function(response) {
                loadStories();
                resetForm();
                showToast('Success', 'Story created successfully!', 'success');
            },
            error: function(xhr, status, error) {
                showToast('Error', 'Failed to create story: ' + error, 'error');
            },
            complete: function() {
                resetSubmitButton();
            }
        });
    }

    // Update existing story
    function updateStory(id, title, content) {
        $.ajax({
            url: `${API_URL}${id}`,
            method: 'PUT',
            data: { title, content },
            success: function(response) {
                loadStories();
                resetForm();
                showToast('Success', 'Story updated successfully!', 'success');
            },
            error: function(xhr, status, error) {
                showToast('Error', 'Failed to update story: ' + error, 'error');
            },
            complete: function() {
                resetSubmitButton();
            }
        });
    }

    // Reset submit button state
    function resetSubmitButton() {
        const buttonText = isEditing ? 
            '<i class="fas fa-edit me-1"></i>Update Story' : 
            '<i class="fas fa-plus-circle me-1"></i>Add Story';
        $('#submitBtn').prop('disabled', false).html(buttonText);
    }

    // Show toast notification
    function showToast(title, message, type) {
        const toastHTML = `
            <div class="toast-container position-fixed bottom-0 end-0 p-3">
                <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0" role="alert">
                    <div class="d-flex">
                        <div class="toast-body">
                            <strong>${title}:</strong> ${message}
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing toasts
        $('.toast-container').remove();
        
        // Add and show new toast
        $('body').append(toastHTML);
        $('.toast').toast('show');
    }

    // Cancel button handler
    $('#cancelBtn').on('click', function() {
        resetForm();
    });

    // Load all stories
    function loadStories() {
        $.ajax({
            url: API_URL,
            method: 'GET',
            success: function(stories) {
                displayStories(stories);
            },
            error: function(xhr, status, error) {
                alert('Error loading stories: ' + error);
            }
        });
    }

    // Delete story
    function deleteStory(id) {
        if (confirm('Are you sure you want to delete this story?')) {
            $.ajax({
                url: `${API_URL}${id}`,
                method: 'DELETE',
                success: function(response) {
                    loadStories();
                    alert('Story deleted successfully!');
                },
                error: function(xhr, status, error) {
                    alert('Error deleting story: ' + error);
                }
            });
        }
    }

    // Display stories in the list
    function displayStories(stories) {
        const storiesList = $('#storiesList');
        storiesList.empty();

        // Update story count
        $('#storyCount').text(`${stories.length} Stories`);

        stories.forEach(story => {
            if (story.title && story.content) {
                // Escape the content to prevent XSS
                const escapedTitle = $('<div>').text(story.title).html();
                const escapedContent = $('<div>').text(story.content).html();
                
                const storyElement = `
                    <div class="story-card">
                        <h3>${escapedTitle}</h3>
                        <p>${escapedContent}</p>
                        <div class="story-actions">
                            <button class="btn btn-warning btn-sm" onclick="editStory('${story.id}', '${escapedTitle}', '${escapedContent}')">
                                <i class="fas fa-edit me-1"></i>Edit
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteStory('${story.id}')">
                                <i class="fas fa-trash me-1"></i>Delete
                            </button>
                        </div>
                    </div>
                `;
                storiesList.append(storyElement);
            }
        });
    }

    // Reset form to initial state
    function resetForm() {
        $('#storyForm')[0].reset();
        $('#storyId').val('');
        $('#submitBtn').text('Add Story');
        $('#cancelBtn').hide();
        isEditing = false;
    }

    // Edit story handler
    window.editStory = function(id, title, content) {
        $('#storyId').val(id);
        $('#title').val(title);
        $('#content').val(content);
        $('#submitBtn').text('Update Story');
        $('#cancelBtn').show();
        isEditing = true;
        $('html, body').animate({ scrollTop: 0 }, 'slow');
    };

    // Make deleteStory function available globally
    window.deleteStory = deleteStory;

    function fetchRandomDog() {
        const dogCard = $('#dogCard');
        const dogImage = $('#dogImage');
        const fetchBtn = $('#fetchDogBtn');
        
        // Show loading state
        fetchBtn.prop('disabled', true)
            .html('<i class="fas fa-spinner loading-spinner me-2"></i>Fetching...');
        
        $.ajax({
            url: DOG_API_URL,
            method: 'GET',
            success: function(response) {
                if (response.status === 'success') {
                    dogImage.attr('src', response.message);
                    dogCard.fadeIn();
                    // Scroll to dog image on mobile
                    if (window.innerWidth < 768) {
                        $('html, body').animate({
                            scrollTop: dogCard.offset().top - 20
                        }, 'slow');
                    }
                } else {
                    showToast('Error', 'Failed to fetch dog image', 'error');
                }
            },
            error: function(xhr, status, error) {
                showToast('Error', 'Failed to fetch dog image: ' + error, 'error');
            },
            complete: function() {
                // Reset button state
                fetchBtn.prop('disabled', false)
                    .html('<i class="fas fa-dog me-2"></i>Fetch Random Dog!');
            }
        });
    }

    // Add click handler for the fetch button
    $('#fetchDogBtn').on('click', fetchRandomDog);

    // Add error handler for dog image
    $('#dogImage').on('error', function() {
        showToast('Error', 'Failed to load dog image', 'error');
        $('#dogCard').hide();
    });
}); 