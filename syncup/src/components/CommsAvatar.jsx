function CommsAvatar({ picture, name, className = "" }) {
  return (
    <span className={`comms-avatar ${className}`} aria-hidden="true">
      {picture ? (
        <img src={picture} alt="" className="profile-avatar" />
      ) : (
        <span className="profile-avatar profile-avatar-fallback">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}

export default CommsAvatar;