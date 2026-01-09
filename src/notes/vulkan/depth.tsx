import Code from "../../Code";
import CodeFunc from "../../CodeFunc";

export default function Depth(){

return <>

<p>
As we move our vertices to 3D, we need a depth buffer to resolve which objects are on top of each other. 

We first start with updating our vertices to 3D, and our hardcoded vertices.
    
<Code>
{`struct Vertex
{
	glm::vec3 pos;
	glm::vec3 color;
	glm::vec2 texCoord;

	static vk::VertexInputBindingDescription getBindingDescription()
	{
		return { 0, sizeof(Vertex), vk::VertexInputRate::eVertex };
	}

	static std::array<vk::VertexInputAttributeDescription, 3> getAttributeDescriptions()
	{
		return {
			vk::VertexInputAttributeDescription(0, 0, vk::Format::eR32G32B32Sfloat, offsetof(Vertex, pos)),
			vk::VertexInputAttributeDescription(1, 0, vk::Format::eR32G32B32Sfloat, offsetof(Vertex, color)),
			vk::VertexInputAttributeDescription(2, 0, vk::Format::eR32G32Sfloat, offsetof(Vertex, texCoord)) 
		};
	}
};

const std::vector<Vertex> vertices = {
    {{-0.5f, -0.5f, 0.0f}, {1.0f, 0.0f, 0.0f}, {0.0f, 0.0f}},
    {{0.5f, -0.5f, 0.0f}, {0.0f, 1.0f, 0.0f}, {1.0f, 0.0f}},
    {{0.5f, 0.5f, 0.0f}, {0.0f, 0.0f, 1.0f}, {1.0f, 1.0f}},
    {{-0.5f, 0.5f, 0.0f}, {1.0f, 1.0f, 1.0f}, {0.0f, 1.0f}},

    {{-0.5f, -0.5f, -0.5f}, {1.0f, 0.0f, 0.0f}, {0.0f, 0.0f}},
    {{0.5f, -0.5f, -0.5f}, {0.0f, 1.0f, 0.0f}, {1.0f, 0.0f}},
    {{0.5f, 0.5f, -0.5f}, {0.0f, 0.0f, 1.0f}, {1.0f, 1.0f}},
    {{-0.5f, 0.5f, -0.5f}, {1.0f, 1.0f, 1.0f}, {0.0f, 1.0f}}
};

const std::vector<uint16_t> indices = {
    0, 1, 2, 2, 3, 0,
    4, 5, 6, 6, 7, 4
};`}
</Code>
</p>

<p>To create a depth attachment, we simply use an image, with a depth for each pixel of the render. Therefore we first need to setup the resources for this image.
<Code>
{`vk::raii::Image depthImage = nullptr;
vk::raii::DeviceMemory depthImageMemory = nullptr;
vk::raii::ImageView depthImageView = nullptr;`}
</Code>

We then need a format for out image. Although there are many common formats, not every format is supported and we will find formats that are supported.
Here we only care if the format supports either linear tiling or optimal tiling.
<Code>
{`vk::Format findSupportedFormat(const std::vector<vk::Format>& candidates, vk::ImageTiling tiling, vk::FormatFeatureFlags features) {
    for (const auto format : candidates) {
        vk::FormatProperties props = physicalDevice.getFormatProperties(format);

        if (tiling == vk::ImageTiling::eLinear && (props.linearTilingFeatures & features) == features) {
            return format;
        }
        if (tiling == vk::ImageTiling::eOptimal && (props.optimalTilingFeatures & features) == features) {
            return format;
        }
    }

    throw std::runtime_error("failed to find supported format!");
}`}
</Code>

Now we can find our depth format.

<Code>
{`VkFormat findDepthFormat() {
   return findSupportedFormat(
        {vk::Format::eD32Sfloat, vk::Format::eD32SfloatS8Uint, vk::Format::eD24UnormS8Uint},
            vk::ImageTiling::eOptimal,
            vk::FormatFeatureFlagBits::eDepthStencilAttachment
        );
}`}
</Code>
</p>

<p>
We then create the depth resources
<Code>
{`void Renderer::createDepthResources()
{
	vk::Format depthFormat = findDepthFormat();
	createImage(swapChainExtent.width, swapChainExtent.height, depthFormat, vk::ImageTiling::eOptimal, vk::ImageUsageFlagBits::eDepthStencilAttachment, vk::MemoryPropertyFlagBits::eDeviceLocal, depthImage, depthImageMemory);
	depthImageView = createImageView(depthImage, depthFormat, vk::ImageAspectFlagBits::eDepth);
}`}
</Code>

 and update our <CodeFunc>createImage</CodeFunc> to take another paraameter for image aspect flags.

</p>

<p>
We can then attach the depth attachment to our <CodeFunc>recordCommandBuffer</CodeFunc>

<Code>
{`vk::RenderingAttachmentInfo depthAttachmentInfo = {
    .imageView   = depthImageView,
    .imageLayout = vk::ImageLayout::eDepthAttachmentOptimal,
    .loadOp      = vk::AttachmentLoadOp::eClear,
    .storeOp     = vk::AttachmentStoreOp::eDontCare,
    .clearValue  = clearDepth};
    
vk::RenderingInfo renderingInfo = {
    ...
    .pDepthAttachment     = &depthAttachmentInfo};`}
</Code>
</p>

<p>
Now we still need to have the depth attachment be in the correct layout for its intended use. We can modify our <CodeFunc>transition_image_layout</CodeFunc> function to support additional image types.

<Code>
{`void Renderer::transition_image_layout(uint32_t imageIndex, vk::ImageLayout old_layout, vk::ImageLayout new_layout, vk::AccessFlags2 src_access_mask, vk::AccessFlags2 dst_access_mask, vk::PipelineStageFlags2 src_stage_mask, vk::PipelineStageFlags2 dst_stage_mask, vk::ImageAspectFlags image_aspect_flags)
{
	vk::ImageMemoryBarrier2 barrier = {
		.srcStageMask = src_stage_mask,
		.srcAccessMask = src_access_mask,
		.dstStageMask = dst_stage_mask,
		.dstAccessMask = dst_access_mask,
		.oldLayout = old_layout,
		.newLayout = new_layout,
		.srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
		.dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
		.image = swapChainImages[imageIndex],
		.subresourceRange = {
			   .aspectMask = image_aspect_flags,
			   .baseMipLevel = 0,
			   .levelCount = 1,
			   .baseArrayLayer = 0,
			   .layerCount = 1} };
	vk::DependencyInfo dependency_info = {
		.dependencyFlags = {},
		.imageMemoryBarrierCount = 1,
		.pImageMemoryBarriers = &barrier };
	commandBuffers[frameIndex].pipelineBarrier2(dependency_info);
}`}
</Code>
</p>

<p>
Now we can transition our depth image
<Code>
{`transition_image_layout(
*depthImage,
vk::ImageLayout::eUndefined,
vk::ImageLayout::eDepthAttachmentOptimal,
vk::AccessFlagBits2::eDepthStencilAttachmentWrite,
vk::AccessFlagBits2::eDepthStencilAttachmentWrite,
vk::PipelineStageFlagBits2::eEarlyFragmentTests | vk::PipelineStageFlagBits2::eLateFragmentTests,
vk::PipelineStageFlagBits2::eEarlyFragmentTests | vk::PipelineStageFlagBits2::eLateFragmentTests,
vk::ImageAspectFlagBits::eDepth);`}
</Code>
</p>

<p>We can now use our depth attachment, and we enable it in the pipeline. We update <CodeFunc>pipelineCreateInfoChain</CodeFunc>
<Code>
{`vk::PipelineDepthStencilStateCreateInfo depthStencil{
    .depthTestEnable = vk::True,
    .depthWriteEnable = vk::True,
    .depthCompareOp = vk::CompareOp::eLess,
    .depthBoundsTestEnable = vk::False,
    .stencilTestEnable = vk::False };
    
    ...
    vk::Format depthFormat = findDepthFormat();
    ...
vk::StructureChain<vk::GraphicsPipelineCreateInfo, vk::PipelineRenderingCreateInfo> pipelineCreateInfoChain = {
    {.stageCount          = 2,
        ...
        .pDepthStencilState  = &depthStencil,
        ...
    {.colorAttachmentCount = 1, .pColorAttachmentFormats = &swapChainSurfaceFormat.format, .depthAttachmentFormat = depthFormat}};
`}
</Code>

</p>

<p>
We also need to recreate our depth resources when the window is resized so our depth image matches the new resolution.

<Code>
{`void recreateSwapChain() {
    int width = 0, height = 0;
    while (width == 0 || height == 0) {
        glfwGetFramebufferSize(window, &width, &height);
        glfwWaitEvents();
    }

    device.waitIdle(device);

    cleanupSwapChain();
    createSwapChain();
    createImageViews();
    createDepthResources();
}`}
</Code>
</p>

</>

}