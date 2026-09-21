import ContentHeader from "@/component/content/ContentHeader";
import ContentMetaRibbon from "@/component/content/ContentMetaRibbon";
import ImageSection from "@/component/content/ImageSection";
import VideoSection from "@/component/content/VideoSection";
import BlogSection from "@/component/content/BlogSection";
import ApprovalHistory from "@/component/content/ApprovalHistory";

const ContentPage = () => {
  return (
    <>
      <ContentHeader />
      <ContentMetaRibbon />

      <div className="layout-grid">
        <div className="content-stack">
          <ImageSection />
          <VideoSection />
          <BlogSection />
        </div>
        <ApprovalHistory />
      </div>
    </>
  );
};

export default ContentPage;
